# app/api.py
from flask import Flask
from flask_restx import Api, Resource, fields, Namespace
from .logic import annuity_payment, schedule, EarlyRepayment
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/mortgage/*": {"origins": "*"}})
api = Api(app, version="1.0", title="Mortgage Calculator API",
          description="Industrial‑practice demo – Mortgage Centre")

ns = Namespace("mortgage", description="Mortgage operations")
api.add_namespace(ns)

repayment_model = ns.model(
    "EarlyRepayment",
    {
        "month":  fields.Integer(required=True, description="Month index (1..N)"),
        "amount": fields.Float(required=True, description="Extra principal, ₸"),
    },
)

request_model = ns.model(
    "MortgageRequest",
    {
        "house_price":  fields.Float(required=True, description="Стоимость жилья, ₸"),
        "down_payment": fields.Float(required=True, description="Первоначальный взнос, ₸"),
        "annual_rate":  fields.Float(required=True, description="Ставка, % годовых"),
        "months":       fields.Integer(required=True, description="Срок, мес"),
        "extra":        fields.List(fields.Nested(repayment_model)),
    },
)

response_model = ns.model(
    "MortgageResponse",
    {
        "monthly_payment": fields.Float,
        "total_interest":  fields.Float,
        "overpayment":     fields.Float,
        "schedule":        fields.List(fields.Raw),
    },
)

@ns.route("/calculate")
class Calculator(Resource):
    @ns.expect(request_model, validate=True)
    @ns.marshal_with(response_model)
    def post(self):
        data = ns.payload
        principal = data["house_price"] - data["down_payment"]
        monthly   = annuity_payment(principal, data["annual_rate"], data["months"])

        extra     = [EarlyRepayment(**e) for e in (data.get("extra") or [])]
        sched     = schedule(principal, data["annual_rate"], data["months"], extra)

        total_paid     = sum(r["payment"] for r in sched)
        total_interest = total_paid - principal - sum(e.amount for e in extra)

        return dict(
            monthly_payment=round(monthly, 2),
            total_interest=round(total_interest, 2),
            overpayment=round(total_paid - principal, 2),
            schedule=sched,
        )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
