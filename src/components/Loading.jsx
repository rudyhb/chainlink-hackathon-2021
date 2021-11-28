import React from "react";

export default function Loading({text = "loading", speed = 300}) {
  const [content, setContent] = React.useState(text);

  React.useEffect(() => {
    const handle = window.setInterval(() => {
      setContent(c => (c === text + "..." ? text : c + "."));
    }, speed);

    return () => {
      window.clearInterval(handle);
    };
  }, [text, speed]);

  return <span>{content}</span>;
};
