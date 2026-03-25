import { NewsDetailScreen } from "@/components/screens/news-detail-screen";

export default async function NewsDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewsDetailScreen id={id} />;
}
