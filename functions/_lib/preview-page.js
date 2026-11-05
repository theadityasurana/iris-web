/** Returns a page with its link-preview tags replaced. */
const setContent = value => ({ element(el) { el.setAttribute('content', value); } });

export function withPreview(page, p, requestUrl) {
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(p.title); } })
    .on('meta[name="description"]', setContent(p.description))
    .on('meta[property="og:title"]', setContent(p.title))
    .on('meta[property="og:description"]', setContent(p.description))
    .on('meta[property="og:url"]', setContent(requestUrl))
    .on('meta[property="og:image"]', setContent(p.image))
    .on('meta[property="og:image:secure_url"]', setContent(p.image))
    .on('meta[property="og:image:type"]', setContent('image/jpeg'))
    .on('meta[property="og:image:alt"]', setContent(p.title))
    .on('meta[name="twitter:title"]', setContent(p.title))
    .on('meta[name="twitter:description"]', setContent(p.description))
    .on('meta[name="twitter:image"]', setContent(p.image))
    .transform(page);
}
