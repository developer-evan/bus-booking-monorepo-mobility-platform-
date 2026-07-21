import { ActivatedRoute } from '@angular/router';

export interface PortalPageMeta {
  title: string;
  subtitle: string;
}

export function readPortalPageMeta(
  route: ActivatedRoute,
  fallback: PortalPageMeta,
): PortalPageMeta {
  let child: ActivatedRoute | null = route;

  while (child?.firstChild) {
    child = child.firstChild;
  }

  const data = child?.snapshot?.data ?? route.snapshot?.data ?? {};

  return {
    title: (data['title'] as string | undefined) ?? fallback.title,
    subtitle: (data['subtitle'] as string | undefined) ?? fallback.subtitle,
  };
}
