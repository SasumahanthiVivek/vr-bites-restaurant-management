const imageModules = import.meta.glob("./images/*", {
  eager: true,
  import: "default",
});

const imageMap = Object.fromEntries(
  Object.entries(imageModules).map(([modulePath, moduleUrl]) => [
    modulePath.replace("./images/", ""),
    moduleUrl,
  ])
);

export function getImage(fileName) {
  return imageMap[fileName] || "";
}
