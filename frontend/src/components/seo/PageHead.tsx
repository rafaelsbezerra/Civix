import { useEffect } from 'react';

export interface PageHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function PageHead({ title, description, canonicalPath }: PageHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    const createdMeta = !metaDesc && Boolean(description);
    if (!metaDesc && description) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const previousDescription = metaDesc?.getAttribute('content') ?? null;

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    const createdCanonical = !linkCanonical && Boolean(canonicalPath);
    if (!linkCanonical && canonicalPath) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    const previousCanonical = linkCanonical?.getAttribute('href') ?? null;

    const fullTitle = `${title} | Civix`;
    document.title = fullTitle;

    if (description && metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    if (canonicalPath && linkCanonical) {
      linkCanonical.setAttribute('href', `https://civix.com.br${canonicalPath}`);
    }

    return () => {
      document.title = previousTitle;

      if (createdMeta && metaDesc?.parentNode) {
        metaDesc.parentNode.removeChild(metaDesc);
      } else if (previousDescription !== null && metaDesc) {
        metaDesc.setAttribute('content', previousDescription);
      }

      if (createdCanonical && linkCanonical?.parentNode) {
        linkCanonical.parentNode.removeChild(linkCanonical);
      } else if (previousCanonical !== null && linkCanonical) {
        linkCanonical.setAttribute('href', previousCanonical);
      }
    };
  }, [title, description, canonicalPath]);

  return null;
}
