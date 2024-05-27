import { Action, ActionPanel, Form, Icon } from "@raycast/api";
import { FormValidation, useForm, usePromise } from "@raycast/utils";
import * as React from "react";
import { CommandAnswer } from "../../../settings/enum";
import { GetOllamaServerByName, SetSettingsCommandAnswer } from "../../../settings/settings";
import { SettingsCommandAnswer } from "../../../settings/types";
import { GetModelsName } from "../../function";

interface props {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  revalidate: CallableFunction;
  command: CommandAnswer;
  server?: string;
  model?: string;
}

interface FormData {
  server: string;
  model: string;
}

export function EditModel(props: props): JSX.Element {
  const { data: Model, isLoading: IsLoadingModel } = usePromise(GetModelsName, []);
  const { handleSubmit, itemProps } = useForm<FormData>({
    onSubmit(values) {
      Submit(values);
    },
    initialValues: {
      server: props.server,
      model: props.model,
    },
    validation: {
      server: FormValidation.Required,
      model: FormValidation.Required,
    },
  });

  const ActionView = (
    <ActionPanel>
      <Action.SubmitForm onSubmit={handleSubmit} />
      <Action title="Close" icon={Icon.Xmark} onAction={() => props.setShow(false)} />
    </ActionPanel>
  );

  async function Submit(values: FormData): Promise<void> {
    const s = await GetOllamaServerByName(values.server);
    const o: SettingsCommandAnswer = {
      server: values.server,
      model: {
        main: {
          server: s,
          tag: values.model,
        },
      },
    };
    await SetSettingsCommandAnswer(props.command, o);
    props.revalidate();
    props.setShow(false);
  }

  return (
    <Form actions={ActionView}>
      {!IsLoadingModel && Model && (
        <Form.Dropdown title="Server" {...itemProps.server}>
          {[...Model.keys()].sort().map((s) => (
            <Form.Dropdown.Item title={s} value={s} key={s} />
          ))}
        </Form.Dropdown>
      )}
      {!IsLoadingModel && Model && itemProps.server.value && (
        <Form.Dropdown title="Model" {...itemProps.model}>
          {[...Model.entries()]
            .filter((v) => v[0] === itemProps.server.value)[0][1]
            .sort()
            .map((s) => (
              <Form.Dropdown.Item title={s} value={s} key={s} />
            ))}
        </Form.Dropdown>
      )}
    </Form>
  );
}
