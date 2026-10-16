// Stripe Publishable Key.
const stripe = Stripe("pk_test_51UPk2DIGGq3bzbrKaAed8thmRFGxkeUFtJ0Ik3koh4nTki1NStxj4IYNJA55TtqO4sqfKuFYFcCY4XrIUoZ1ikGo00IWad4iyH");

let elements;

// Keep the form disabled until Elements has initialized.
setLoading(true);
initialize().catch((error) => showMessage(error.message));

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

async function initialize() {
  // Fetch the server-calculated total without creating a PaymentIntent.
  const item = new URLSearchParams(window.location.search).get("item");
  const response = await fetch(`/calculate-order?item=${item}`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to load the order.");
  const order = await response.json();

  const appearance = {
    theme: 'stripe',
  };
  elements = stripe.elements({
    mode: "payment",
    amount: order.amount,
    currency: order.currency,
    appearance,
  });

  const paymentElement = elements.create("payment", { layout: "accordion" });
  paymentElement.mount("#payment-element");
  setLoading(false);
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!elements || document.querySelector("#submit").disabled) return;
  setLoading(true);

  try {
    const { error: submitError } = await elements.submit();
    if (submitError) {
      showMessage(submitError.message);
      return;
    }

    // Create the PaymentIntent only after the customer submits payment details.
    const item = new URLSearchParams(window.location.search).get("item");
    const response = await fetch(`/create-payment-intent?item=${item}`, { method: "POST" });
    if (!response.ok) throw new Error("Unable to start the payment. Try again.");
    const { clientSecret } = await response.json();

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: "http://localhost:3000/success",
      },
    });

    // Successful payments redirect to the return_url. Display immediate errors.
    if (error) showMessage(error.message);
  } catch (error) {
    showMessage(error.message);
  } finally {
    setLoading(false);
  }
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  document.querySelector("#submit").disabled = isLoading;
}