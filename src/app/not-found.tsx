import { ButtonLink } from "@/components/ui";
import { notFound as text } from "@/content/ko";

export default function NotFound() {
  return (
    <main className="container stack-lg" style={{ paddingBlock: "4rem" }}>
      <h1>{text.title}</h1>
      <p>{text.body}</p>
      <div><ButtonLink href="/" variant="primary">{text.home}</ButtonLink></div>
    </main>
  );
}
