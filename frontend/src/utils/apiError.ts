// The API mostly returns errors as {error: {code, message}}, but a few endpoints still send
// {error: "plain string"} and the schedule routes send {message: "..."}. Reading any of them
// with the wrong shape either renders "[object Object]" or silently swallows the message,
// so everything goes through here.
export const readApiError = (data: unknown, fallback: string): string => {
  if (typeof data !== "object" || data === null) return fallback;

  if ("error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.length > 0) return err;
    if (typeof err === "object" && err !== null && "message" in err) {
      const message = (err as { message: unknown }).message;
      if (typeof message === "string" && message.length > 0) return message;
    }
  }

  // schedule endpoints put the message at the top level with no error key
  if ("message" in data) {
    const message = (data as { message: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }

  return fallback;
};
