import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <PageHeader title="Not found" />
      <ButtonLink href="/" className="mt-6">
        Go home
      </ButtonLink>
    </div>
  );
}
