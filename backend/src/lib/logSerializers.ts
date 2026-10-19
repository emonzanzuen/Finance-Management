interface RequestLogFields {
  id?: string;
  method?: string;
  url?: string;
  remoteAddress?: string | null;
}

/** Keep personal data, query values, and request bodies out of access logs. */
export function serializeRequest(req: RequestLogFields) {
  return {
    id: req.id,
    method: req.method,
    url: req.url?.split('?')[0],
    remoteAddress: req.remoteAddress,
  };
}
