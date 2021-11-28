import React from "react";

export default function useLocalStorage(
  storageName,
  initialValue,
  useJson = true
) {
  const key = `storage-${storageName}`;
  const [value, setValue] = React.useState(() => {
    const get = useJson ? (s) => JSON.parse(s) : (s) => s;
    const storageVal = window.localStorage.getItem(key);
    if (storageVal) {
      return get(storageVal);
    }
    return initialValue;
  });

  React.useEffect(() => {
    const put= useJson ? (s) => JSON.stringify(s) : (s) => String(s);
    window.localStorage.setItem(key, put(value));
  }, [value, useJson, key]);

  return [value, setValue];
}
