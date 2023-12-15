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
  Families?: string[];
}

interface FormData {
  ShowModelEmbedding: boolean;
  ModelGenerate: string | undefined;
  ModelEmbedding: string | undefined;
}

/**
 * Return JSX element for chose used model.
 * @param {props} props
 * @returns {JSX.Element} Raycast SetModelView.
 */
export function SetModelView(props: props): JSX.Element {
  const { isLoading: isLoadingInstalledModels, data: InstalledModels } = usePromise(
    getInstalledModels,
    [props.Families],
    {
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
    }
  );
  const { isLoading: isLoadingEmbeddingModel, data: EmbeddingModel } = usePromise(GetModelEmbeddingFromLocalStorage);
  const [ShowEmbeddingModel, SetShowEmbeddingModel]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] =
    React.useState(false);

  /**
   *  Save chosen model on LocalStorage.
   * @param {string} model - Model.}
   */
  function setLocalStorageModels(data: FormData): void {
    if (data.ModelGenerate) LocalStorage.setItem(`${props.Command}_model_generate`, data.ModelGenerate);
    if (data.ShowModelEmbedding && data.ModelEmbedding) {
      LocalStorage.setItem(`${props.Command}_model_embedding`, data.ModelEmbedding);
    } else {
      LocalStorage.removeItem(`${props.Command}_model_embedding`);
    }
    props.ShowModelView(false);
  }

  /**
   * Get Model for Generate from LocalStorage.
   * @returns {Promise<string>} Model generate.
   */
  async function GetModelGenerateFromLocalStorage(): Promise<string> {
    const m = await LocalStorage.getItem(`${props.Command}_model_generate`);
    return m as string;
  }

  /**
   * Get Model for Embedding from LocalStorage.
   * @returns {Promise<string>} Model embedding.
   */
  async function GetModelEmbeddingFromLocalStorage(): Promise<string> {
    const m = await LocalStorage.getItem(`${props.Command}_model_embedding`);
    return m as string;
  }

  /**
   * Retrive installed model on Ollama.
   * @param {string[]} families - Filter Installed Models by Families.
   * @returns {Promise<string[]>} Installed models as an array of string.
   */
  async function getInstalledModels(families: string[] | undefined): Promise<string[]> {
    const InstalledModels = await OllamaApiTags();
    if (families)
      return InstalledModels.models
        .filter((t) => {
          if (!t.details.families) return false;
          if (t.details.families.find((f) => families.find((fq) => f === fq))) return true;
        })
        .map((t) => t.name);
    return InstalledModels.models.map((t) => t.name);
  }

  React.useEffect(() => {
    if (EmbeddingModel) SetShowEmbeddingModel(true);
  }, [EmbeddingModel]);

  const FormEmbedding = (
    <Form.Checkbox
      id="ShowModelEmbedding"
      title="Embedding"
      label="Use Different Model for Embedding"
      onChange={SetShowEmbeddingModel}
      storeValue={true}
    />
  );

  const FormModelGenerate = (
    <Form.Dropdown id="ModelGenerate" title="Model" storeValue={true}>
      {!isLoadingInstalledModels && InstalledModels
        ? InstalledModels.map((model) => {
            return <Form.Dropdown.Item value={model} title={model} key={model} />;
          })
        : null}
    </Form.Dropdown>
  );

  const FormModelEmbedding = (
    <Form.Dropdown id="ModelEmbedding" title="Model for Embedding" storeValue={true}>
      {!isLoadingEmbeddingModel && InstalledModels
        ? InstalledModels.map((model) => {
            return <Form.Dropdown.Item value={model} title={model} key={model} />;
          })
        : null}
    </Form.Dropdown>
  );

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={setLocalStorageModels} />
          <Action.Open
            title="Manage Models"
            icon={Icon.Box}
            target="raycast://extensions/massimiliano_pasquini/raycast-ollama/ollama-models"
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          />
        </ActionPanel>
      }
    >
      {!isLoadingInstalledModels ? FormModelGenerate : null}
      {!isLoadingInstalledModels && props.Command === "chat" ? FormEmbedding : null}
      {!isLoadingInstalledModels && ShowEmbeddingModel ? FormModelEmbedding : null}
    </Form>
  );
}
