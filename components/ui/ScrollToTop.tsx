
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A component that scrolls the window to the top on every route change.
 * It also manually controls the browser's scroll restoration to prevent "jumpy" navigation.
 * This should be placed inside the Router component.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // This is the definitive fix for the "double refresh" issue.
    // On every navigation, we first command the browser to not handle scroll restoration.
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
    // Then, we manually scroll to the top. This prevents the browser from "jumping"
    // to the old scroll position before our code can react.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
