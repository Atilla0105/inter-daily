import { FixtureDetailScreen } from "@/components/screens/fixture-detail-screen";

export default async function FixturePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FixtureDetailScreen id={id} />;
}
