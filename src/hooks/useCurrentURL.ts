import { useLocation } from 'react-router-dom';

/**
 * Returns the current path and query string of the URL.  This hook is used when
 * building navigation state (e.g. `state={{ back: currentURL }}`) so that
 * pages can navigate back to the correct location without relying on
 * `navigate(-1)`【625993344288175†L58-L68】.
 */
export function useCurrentURL(): string {
  const location = useLocation();
  return location.pathname + location.search;
}