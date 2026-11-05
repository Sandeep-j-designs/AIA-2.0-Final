import { useEffect, useState } from "react";
import type React from "react";

/**
 * "Reward early, punish late" for a field's error (5 Nov 2026).
 *
 * Forms re-validate on every change once Save has been pressed, so an error
 * could appear mid-word ("Invalid GSTIN" after the third character) and the
 * row grew and shrank with each keystroke. Here an error that turns up while
 * the field has focus waits until focus leaves it; an error that was already
 * showing stays while you fix it and clears the moment the value is right.
 * Away from focus (Save, a value set by another field) errors show at once.
 *
 * Spread `focusProps` on the control or on a wrapper around it: focus events
 * bubble in React, and a move between parts of the same field (a combobox
 * and its search box) is not a blur.
 */
export function useLateError<T>(error: T | null | undefined | false | "") {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState<T | undefined>(error || undefined);
  useEffect(() => {
    if (!error) setShown(undefined);
    else if (!focused || shown) setShown(error);
    // `shown` is read, not watched: it only decides whether a new error waits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, focused]);
  return {
    /** The error to draw. */
    error: shown,
    /** The error exists but is waiting for blur. */
    holding: !!error && !shown,
    focusProps: {
      onFocus: () => setFocused(true),
      onBlur: (event: React.FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (!next || !event.currentTarget.contains(next)) setFocused(false);
      },
    },
  };
}
