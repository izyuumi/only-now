export function generateCircle(): void {
  const numCircles = 1;
  const container = document.getElementById("box-container");

  if (container) {
    for (let i = 1; i <= numCircles; i++) {
      const li: HTMLLIElement = document.createElement("li");
      li.style.left = `${Math.random() * 100}%`;
      li.style.width = `${Math.random() * 50}px`;
      li.style.height = li.style.width;
      li.style.animationDuration = `${Math.random() * 20 + 5}s`;
      li.style.animationDelay = `0s`;

      li.classList.add("box");

      container.appendChild(li);
    }
  }
}
