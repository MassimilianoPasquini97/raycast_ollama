import { getPreferenceValues } from "@raycast/api";
import { Preferences, RaycastArgumentsOllamaCommandCustom } from "./lib/types";
import { AnswerView } from "./lib/ui/AnswerView/main";

const p = getPreferenceValues<Preferences>();
if (!p.ollamaCertificateValidation) process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

export default function Command(props: RaycastArgumentsOllamaCommandCustom): JSX.Element {
  return (
    <AnswerView
      server={props.arguments.server}
      model={props.arguments.model}
      prompt={props.arguments.prompt}
      creativity={Number(props.arguments.creativity)}
    />
  );
}
