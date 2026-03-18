"use client";

export function CopyLinkButton() {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(window.location.href)}
      className="text-primary text-sm font-medium hover:underline mt-1"
    >
      Copy link
    </button>
  );
}
