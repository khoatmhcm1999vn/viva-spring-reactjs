import { emojiList } from "constant/emojiList";
import { toArray } from "react-emoji-render";

export const parseTextToEmojis = (value) => {
  const emojisArray = toArray(value);
  const newValue = emojisArray.reduce((previous, current) => {
    if (typeof current === "string") {
      return previous + current;
    }
    return previous + current.props.children;
  }, "");

  return newValue;
};

export const isOnlyEmojis = (textInput) => {
  const emojisArray = toArray(textInput);
  let isOnlyEmojis = true;
  for (let i = 0; i < emojisArray.length; i++) {
    if (
      !emojisArray[i].type &&
      typeof emojisArray[i] === "string" &&
      !emojiList.find((emoji) => emoji === emojisArray[i])
    ) {
      isOnlyEmojis = false;
      break;
    }
  }
  return isOnlyEmojis;
};
