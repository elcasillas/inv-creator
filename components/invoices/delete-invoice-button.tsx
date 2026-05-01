"use client";

export function DeleteInvoiceButton() {
  return (
    <button
      type="submit"
      className="text-rose-600 hover:text-rose-700"
      onClick={(event) => {
        if (!window.confirm("Delete this invoice?")) {
          event.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
