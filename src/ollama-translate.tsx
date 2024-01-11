import { AnswerView } from "./api/ui/AnswerView";

export default function Command(): JSX.Element {
  const c = "translate";
  const p = "Act as a translator. Translate the following text.\n\nOutput only with the translated text.\n";
  return <AnswerView command={c} prompt={p} />;
}
