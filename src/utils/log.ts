export default function MaifaLog(...text: string[]) {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toLocaleString()}]`, text);
}
