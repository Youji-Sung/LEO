import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function Consumer() {
  useToast();
  return <span>ok</span>;
}

describe("ToastProvider", () => {
  it("renders children and an empty polite status region after them", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <main>내용</main>
      </ToastProvider>,
    );
    expect(html).toBe('<main>내용</main><div class="toast-region" role="status" aria-live="polite"></div>');
  });

  it("provides the context to descendants", () => {
    expect(
      renderToStaticMarkup(
        <ToastProvider>
          <Consumer />
        </ToastProvider>,
      ),
    ).toContain("<span>ok</span>");
  });
});

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    expect(() => renderToStaticMarkup(<Consumer />)).toThrow(/ToastProvider/);
  });
});
