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
import React from "react";
import { usePromise } from "@raycast/utils";
import { GetModel } from "../common";
import { ModelType, OllamaApiTagsResponseModel } from "../types";

interface props {
  Command: string;
  ShowModelView: React.Dispatch<React.SetStateAction<boolean>>;
  Families?: string[];
}

interface FormData {
  ShowModelEmbedding: boolean;
  ShowModelImage: boolean;
  ModelGenerate: string | undefined;
  ModelEmbedding: string | undefined;
  ModelImage: string | undefined;
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
  const { isLoading: isLoadingEmbeddingModel, data: EmbeddingModel } = usePromise(
    GetModel,
    [props.Command, false, undefined, ModelType.EMBEDDING],
    {
      onError: () => {
        return;
      },
    }
  );
  const { isLoading: isLoadingImageModel, data: ImageModel } = usePromise(
    GetModel,
    [props.Command, true, undefined, ModelType.IMAGE],
    {
      onError: () => {
        return;
      },
    }
  );
  const [ShowEmbeddingModel, SetShowEmbeddingModel]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] =
    React.useState(false);
  const [ShowImageModel, SetShowImageModel]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] =
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
    if (data.ShowModelImage && data.ModelImage) {
      LocalStorage.setItem(`${props.Command}_model_image`, data.ModelImage);
    } else {
      LocalStorage.removeItem(`${props.Command}_model_image`);
    }
    props.ShowModelView(false);
  }

  /**
   * Retrive installed model on Ollama.
   * @param {string[]} families - Filter Installed Models by Families.
   * @returns {Promise<string[]>} Installed models as an array of string.
   */
  async function getInstalledModels(families: string[] | undefined): Promise<OllamaApiTagsResponseModel[]> {
    const InstalledModels = await OllamaApiTags();
    if (families)
      return InstalledModels.models.filter((t) => {
        if (!t.details.families) return false;
        if (t.details.families.find((f) => families.find((fq) => f === fq))) return true;
      });
    return InstalledModels.models;
  }

  React.useEffect(() => {
    if (EmbeddingModel) SetShowEmbeddingModel(true);
    if (ImageModel) SetShowImageModel(true);
  }, [EmbeddingModel, ImageModel]);

  const FormEmbedding = (
    <Form.Checkbox
      id="ShowModelEmbedding"
      title="Embedding"
      label="Use Different Model for Embedding"
      onChange={SetShowEmbeddingModel}
      storeValue={true}
    />
  );

  const FormImage = (
    <Form.Checkbox
      id="ShowModelImage"
      title="Image"
      label="Use Multimodal Model for Image"
      onChange={SetShowImageModel}
      storeValue={true}
    />
  );

  function FormModelGenerate(props: { models: OllamaApiTagsResponseModel[] | undefined }): JSX.Element {
    return (
      <Form.Dropdown id="ModelGenerate" title="Model" storeValue={true}>
        {props.models
          ? props.models.map((model) => {
              return <Form.Dropdown.Item value={model.name} title={model.name} key={model.name} />;
            })
          : null}
      </Form.Dropdown>
    );
  }
  function FormModelEmbedding(props: { models: OllamaApiTagsResponseModel[] | undefined }): JSX.Element {
    return (
      <Form.Dropdown id="ModelEmbedding" title="Model for Embedding" storeValue={true}>
        {props.models
          ? props.models.map((model) => {
              return <Form.Dropdown.Item value={model.name} title={model.name} key={model.name} />;
            })
          : null}
      </Form.Dropdown>
    );
  }
  function FormModelImage(props: { models: OllamaApiTagsResponseModel[] | undefined }): JSX.Element {
    return (
      <Form.Dropdown id="ModelImage" title="Model for Image" storeValue={true}>
        {props.models
          ? props.models
              .filter((f) => (f.details.families ? f.details.families.find((f) => f === "clip") : false))
              .map((model) => {
                return <Form.Dropdown.Item value={model.name} title={model.name} key={model.name} />;
              })
          : null}
      </Form.Dropdown>
    );
  }

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
      {!isLoadingInstalledModels ? <FormModelGenerate models={InstalledModels} /> : null}
      {!isLoadingInstalledModels && props.Command === "chat" ? FormEmbedding : null}
      {!isLoadingInstalledModels && ShowEmbeddingModel ? <FormModelEmbedding models={InstalledModels} /> : null}
      {!isLoadingInstalledModels && props.Command === "chat" ? FormImage : null}
      {!isLoadingInstalledModels && ShowImageModel ? <FormModelImage models={InstalledModels} /> : null}
    </Form>
  );
}
