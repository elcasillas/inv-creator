"use client";

export function DeleteClientButton() {
  return (
    <button
      type="submit"
      className="text-rose-600 hover:text-rose-700"
      onClick={(event) => {
        if (!window.confirm("Delete this client?")) {
          event.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
