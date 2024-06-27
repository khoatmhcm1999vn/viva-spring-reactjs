export const handleCheckNumberOfCharacters = (textInput) => {
  return textInput.length >= 6;
};

export const handleCheckAtleastOneNormal = (textInput) => {
  return textInput.match(/[a-z]+/);
};

export const handleCheckAtleastOneCapital = (textInput) => {
  return textInput.match(/[A-Z]+/);
};

export const handleCheckAtleastNumber = (textInput) => {
  return textInput.match(/[0-9]+/);
};

export const hanldeCheckAtleastSymbol = (textInput) => {
  return textInput.match(/[!@#$%^&*]+/);
};

export const checkAllCondition = (textInput) => {
  return (
    handleCheckNumberOfCharacters(textInput) &&
    handleCheckAtleastOneNormal(textInput) &&
    handleCheckAtleastOneCapital(textInput) &&
    handleCheckAtleastNumber(textInput) &&
    hanldeCheckAtleastSymbol(textInput)
  );
};

export const getStrongScore = (textInput) => {
  let score = 0;
  if (handleCheckNumberOfCharacters(textInput)) {
    score += 1;
  }
  if (handleCheckAtleastOneNormal(textInput)) {
    score += 1;
  }
  if (handleCheckAtleastOneCapital(textInput)) {
    score += 1;
  }
  if (handleCheckAtleastNumber(textInput)) {
    score += 1;
  }
  if (hanldeCheckAtleastSymbol(textInput)) {
    score += 1;
  }
  return score === 5 ? (
    <strong style={{ color: "rgb(49, 162, 76)" }}>Strong</strong>
  ) : score === 3 || score === 4 ? (
    <strong style={{ color: "rgb(255, 193, 7)" }}>Medium</strong>
  ) : (
    <strong style={{ color: "rgb(255, 56, 56)" }}>Weak</strong>
  );
};

export const handleCheckValidEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
