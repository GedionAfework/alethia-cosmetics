"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <PageHeader title="Something went wrong" description="The page could not be loaded. Try it again." />
      <Button type="button" className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
