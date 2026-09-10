export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Choose or Design",
      description:
        "Browse the gallery or create your own custom T-Shirt.",
    },
    {
      number: "2",
      title: "Select Sizes",
      description:
        "Enter quantity for each size (S, M, L, XL, XXL).",
    },
    {
      number: "3",
      title: "Verify Email",
      description:
        "New customers verify once using OTP. Existing customers skip this step.",
    },
    {
      number: "4",
      title: "Submit Quote",
      description:
        "Your design and size details are sent to our admin.",
    },
    {
      number: "5",
      title: "Admin Reviews",
      description:
        "Our team reviews your request and contacts you.",
    },
    {
      number: "6",
      title: "Order Confirmed",
      description:
        "Approve the quotation and we start production.",
    },
  ];

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">

        <h2 className="mb-16 text-center text-3xl font-extrabold text-dark md:text-4xl lg:text-5xl font-heading">
          How It Works
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">

          {steps.map((step) => (

            <div className="group flex flex-col items-center rounded-[24px] border border-border bg-background p-10 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-xl" key={step.number}>

              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-3xl font-bold text-primary transition-all duration-300 group-hover:scale-110">
                {step.number}
              </div>

              <h3 className="mb-3 text-xl font-bold text-dark font-heading">{step.title}</h3>

              <p className="text-sm leading-7 text-secondary">{step.description}</p>

            </div>

          ))}

        </div>
      </div>
    </section>
  );
}