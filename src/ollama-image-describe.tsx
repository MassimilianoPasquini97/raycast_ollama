import { getPreferenceValues, LaunchProps } from "@raycast/api";
import { Creativity } from "./lib/enum";
import { OllamaApiModelCapability } from "./lib/ollama/enum";
import { CommandAnswer } from "./lib/settings/enum";
import { AnswerView } from "./lib/ui/AnswerView/main";

const pref = getPreferenceValues<Preferences>();
if (!pref.ollamaCertificateValidation) process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

export default function Command(props: LaunchProps<{ arguments: Arguments.OllamaImageDescribe }>): React.JSX.Element {
  const c = CommandAnswer.IMAGE_DESCRIBE;
  const p = "Describe the content on the following images. {image}\n";
  return (
    <AnswerView
      command={c}
      prompt={p}
      creativity={Creativity.Low}
      thinking={props.arguments.thinkingEffort !== "" ? props.arguments.thinkingEffort : undefined}
      capabilities={[OllamaApiModelCapability.VISION]}
    />
  );
}
