export const initializeBackgroundAnimation = () => makeBoxes(10);

const makeBoxes = (n: number) => {
  const container = document.getElementById(
    "box-container",
  ) as HTMLUListElement;
  for (let i = 0; i < n; i++) {
    const li: HTMLLIElement = document.createElement("li");
    li.style.left = `${Math.random() * 100}%`;
    li.style.width = `${Math.random() * 150}px`;
    li.style.height = li.style.width;
    li.style.animationDuration = `${Math.random() * 20 + 5}s`;
    li.style.animationDelay = `${Math.random() * 3}s`;

    li.classList.add("box");
    li.addEventListener("animationend", () => makeBoxes(1));

    container.appendChild(li);
  }
};
