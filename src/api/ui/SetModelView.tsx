import { OllamaApiTags } from "../ollama";
import {
  Form,
  ActionPanel,
  Action,
  LocalStorage,
  Icon,
  showToast,
  Toast,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import { OllamaApiTagsResponse } from "../types";
import React from "react";
import { usePromise } from "@raycast/utils";

interface props {
  Command: string;
  ShowModelView: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Return JSX element for chose used model.
 * @param {props} props
 * @returns {JSX.Element} Raycast SetModelView.
 */
export function SetModelView(props: props): JSX.Element {
  const { isLoading: isLoadingInstalledModels, data: InstalledModels } = usePromise(getInstalledModels, [], {
    onData: async (InstalledModels) => {
      if (InstalledModels.length == 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "No installed models",
          message: "Please install a model to use this command.",
        });
        await launchCommand({ name: "ollama-models", type: LaunchType.UserInitiated });
      }
    },
  });
  const { isLoading: isLoadingCurrentModel, data: CurrentModel } = usePromise(getLocalStorage);

  /**
   *  Save chosen model on LocalStorage.
   * @param {string} model - Model.}
   */
  function setLocalStorageModels(model: string): void {
    LocalStorage.setItem(`${props.Command}_model_generate`, model);
    props.ShowModelView(false);
  }

  /**
   * Get Model from LocalStorage.
   * @returns {Promise<string>} Model.
   */
  async function getLocalStorage(): Promise<string> {
    const m = await LocalStorage.getItem(`${props.Command}_model_generate`);
    return m as string;
  }

  /**
   * Retrive installed model on Ollama.
   * @returns {Promise<string[]>} Installed models as an array of string.
   */
  async function getInstalledModels(): Promise<string[]> {
    /**
     * Convert Ollama Tags API response to an array string.
     * @param {OllamaApiTagsResponse} data - Ollama Api Tags Response.
     * @returns {string[]} Installed models as an array of string.
     */
    function ParseOllamaApiTags(data: OllamaApiTagsResponse): string[] {
      const installedModels: string[] = [];
      data.models.map((model) => {
        installedModels.push(model.name);
      });
      return installedModels;
    }

    const InstalledModels: string[] = await OllamaApiTags().then(ParseOllamaApiTags);

    return InstalledModels;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={(values) => setLocalStorageModels(values.ModelGenerate)} />
          <Action.Open
            title="Manage Models"
            icon={Icon.Box}
            target="raycast://extensions/massimiliano_pasquini/raycast-ollama/ollama-models"
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="ModelGenerate"
        title="Model"
        defaultValue={!isLoadingCurrentModel && !isLoadingInstalledModels ? CurrentModel : undefined}
      >
        {!isLoadingInstalledModels && InstalledModels
          ? InstalledModels.map((model) => {
              return <Form.Dropdown.Item value={model} title={model} key={model} />;
            })
          : null}
      </Form.Dropdown>
    </Form>
  );
}
