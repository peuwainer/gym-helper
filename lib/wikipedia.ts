/**
 * Wikipedia page image lookup.
 * Uses the free Wikipedia API (no key required) to fetch the main thumbnail
 * for a given search term. Best results with English exercise names.
 */
export async function getWikipediaImage(query: string): Promise<string | null> {
  try {
    // First: search for the most relevant Wikipedia article title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    // Second: get the page thumbnail for that article
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();

    const pages = imgData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
