import {
  OllamaApiEmbeddingsResponse,
  OllamaApiGenerateRequestBody,
  OllamaApiGenerateResponseDone,
  OllamaApiGenerateResponseMetadata,
} from "./types";
import { ErrorOllamaCustomModel, ErrorOllamaModelNotInstalled, ErrorRaycastApiNoTextSelected } from "./errors";
import { OllamaApiEmbeddings, OllamaApiGenerate } from "./ollama";
import * as React from "react";
import { Action, ActionPanel, Detail, Icon, List, LocalStorage, Toast, showToast } from "@raycast/api";
import { getSelectedText, getPreferenceValues } from "@raycast/api";

const preferences = getPreferenceValues();

/**
 * Return JSX element with generated text and relative metadata.
 * @param {OllamaApiGenerateRequestBody} body - Ollama Generate Body Request.
 * @param {boolean} selectText - If true, get text from selected text.
 * @param {boolean} embeddings - If true, use embeddings.
 * @param {string} embeddingsModel - Model used for embeddings. By default use same model for inference.
 * @returns {JSX.Element} Raycast Detail View.
 */
export function ResultView(
  body: OllamaApiGenerateRequestBody,
  selectText: boolean,
  embeddings = false,
  embeddingsModel = body.model
): JSX.Element {
  const [embeddingsResponse, setEmbeddingsResponse]: [
    OllamaApiEmbeddingsResponse,
    React.Dispatch<React.SetStateAction<OllamaApiEmbeddingsResponse>>
  ] = React.useState({} as OllamaApiEmbeddingsResponse);
  const [loading, setLoading]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false);
  const [answer, setAnswer]: [string, React.Dispatch<React.SetStateAction<string>>] = React.useState("");
  const [answerMetadata, setAnswerMetadata]: [
    OllamaApiGenerateResponseMetadata,
    React.Dispatch<React.SetStateAction<OllamaApiGenerateResponseMetadata>>
  ] = React.useState({} as OllamaApiGenerateResponseMetadata);

  async function HandleError(err: Error) {
    if (err instanceof ErrorOllamaModelNotInstalled) {
      await showToast({ style: Toast.Style.Failure, title: err.message, message: err.suggest });
      setLoading(false);
      return;
    } else if (err instanceof ErrorOllamaCustomModel) {
      await showToast({
        style: Toast.Style.Failure,
        title: err.message,
        message: `Model: ${err.model}, File: ${err.file}`,
      });
      setLoading(false);
      return;
    } else {
      await showToast({ style: Toast.Style.Failure, title: err.message });
      setLoading(false);
    }
  }

  async function Inference(): Promise<void> {
    await showToast({ style: Toast.Style.Animated, title: "🧠 Performing Inference." });
    setLoading(true);
    OllamaApiGenerate(body)
      .then(async (emiter) => {
        emiter.on("data", (data) => {
          setAnswer((prevState) => prevState + data);
        });

        emiter.on("done", async (data) => {
          await showToast({ style: Toast.Style.Success, title: "🧠 Inference Done." });
          setAnswerMetadata(data);
          setLoading(false);
        });
      })
      .catch(async (err) => {
        await HandleError(err);
      });
  }

  async function Embeddings(text: string): Promise<void> {
    await showToast({ style: Toast.Style.Animated, title: "🧠 Performing Embeddings." });
    setLoading(true);
    await OllamaApiEmbeddings(text, embeddingsModel)
      .then((response) => {
        setLoading(false);
        setEmbeddingsResponse(response);
      })
      .catch(async (err) => {
        await HandleError(err);
      });
  }

  React.useEffect(() => {
    if (selectText && !embeddings) {
      getSelectedText()
        .then((selectedText) => {
          body.prompt = selectedText;
          Inference();
        })
        .catch(async (err) => {
          await showToast({ style: Toast.Style.Failure, title: ErrorRaycastApiNoTextSelected.message });
          console.error(err);
        });
    } else if (!selectText) {
      Inference();
    }
  }, []);

  React.useEffect(() => {
    if (selectText && embeddings) {
      getSelectedText()
        .then((selectedText) => {
          Embeddings(selectedText);
        })
        .catch(async (err) => {
          await showToast({ style: Toast.Style.Failure, title: ErrorRaycastApiNoTextSelected.message });
          console.error(err);
        });
    }
  }, []);

  React.useEffect(() => {
    if (embeddingsResponse.embedding) {
      //Inference();
    }
  }, [embeddingsResponse]);

  return (
    <Detail
      markdown={answer}
      isLoading={loading}
      actions={
        !loading && (
          <ActionPanel title="Actions">
            <Action.CopyToClipboard content={answer} />
            <Action title="Retry" onAction={Inference} shortcut={{ modifiers: ["cmd"], key: "r" }} icon={Icon.Repeat} />
          </ActionPanel>
        )
      }
      metadata={
        !loading &&
        preferences.ollamaShowMetadata && (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Model" text={answerMetadata.model} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="Total Inference Duration"
              text={`${(answerMetadata.total_duration / 1e9).toFixed(2)}s`}
            />
            <Detail.Metadata.Label title="Prompt Eval Count" text={`${answerMetadata.prompt_eval_count}`} />
            <Detail.Metadata.Label
              title="Prompt Eval Duration"
              text={`${(answerMetadata.prompt_eval_duration / 1e9).toFixed(2)}s`}
            />
            <Detail.Metadata.Label title="Eval Count" text={`${answerMetadata.eval_count}`} />
            <Detail.Metadata.Label title="Eval Duration" text={`${(answerMetadata.eval_duration / 1e9).toFixed(2)}s`} />
          </Detail.Metadata>
        )
      }
    />
  );
}

/**
 * Return JSX element with generated text on list view.
 * @param {OllamaApiGenerateRequestBody} body - Ollama Generate Body Request.
 * @returns {JSX.Element} Raycast List View.
 */
export function ListView(body: OllamaApiGenerateRequestBody): JSX.Element {
  const [loading, setLoading]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false);
  const [query, setQuery]: [string, React.Dispatch<React.SetStateAction<string>>] = React.useState("");
  const [selectedAnswer, setSelectedAnswer]: [string, React.Dispatch<React.SetStateAction<string>>] =
    React.useState("0");
  const [answerList, setAnswerList]: [
    [string, string, OllamaApiGenerateResponseDone][] | undefined,
    React.Dispatch<React.SetStateAction<[string, string, OllamaApiGenerateResponseDone][] | undefined>>
  ] = React.useState();

  async function HandleError(err: Error) {
    if (err instanceof ErrorOllamaModelNotInstalled) {
      await showToast({ style: Toast.Style.Failure, title: err.message, message: err.suggest });
      setLoading(false);
      return;
    } else if (err instanceof ErrorOllamaCustomModel) {
      await showToast({
        style: Toast.Style.Failure,
        title: err.message,
        message: `Model: ${err.model}, File: ${err.file}`,
      });
      setLoading(false);
      return;
    } else {
      await showToast({ style: Toast.Style.Failure, title: err.message });
      setLoading(false);
    }
  }

  async function Inference(): Promise<void> {
    await showToast({ style: Toast.Style.Animated, title: "🧠 Performing Inference." });
    setLoading(true);
    body.prompt = query;
    if (answerList) body.context = answerList[answerList.length - 1][2].context;
    setQuery("");
    OllamaApiGenerate(body)
      .then(async (emiter) => {
        setAnswerList((prevState) => {
          if (prevState === undefined) {
            return [[query, "", {} as OllamaApiGenerateResponseDone]];
          }
          setSelectedAnswer(prevState.length.toString());
          return [...prevState, [query, "", {} as OllamaApiGenerateResponseDone]];
        });

        emiter.on("data", (data) => {
          setAnswerList((prevState) => {
            if (prevState) {
              prevState[prevState.length - 1][1] += data;
              return [...prevState];
            }
          });
        });

        emiter.on("done", async (data) => {
          await showToast({ style: Toast.Style.Success, title: "🧠 Inference Done." });
          setAnswerList((prevState) => {
            if (prevState) {
              prevState[prevState.length - 1][2] = data;
              return [...prevState];
            }
          });
          setLoading(false);
        });
      })
      .catch(async (err) => {
        await HandleError(err);
      });
  }

  async function SaveAnswerList(): Promise<void> {
    if (answerList && answerList[answerList.length - 1][2].context) {
      await LocalStorage.setItem("answerList", JSON.stringify(answerList));
    }
  }

  async function GetAnswerList(): Promise<void> {
    await LocalStorage.getItem("answerList").then((data) => {
      if (data) setAnswerList(JSON.parse(data as string));
    });
  }

  async function ClearAnswerList(): Promise<void> {
    await LocalStorage.removeItem("answerList");
    setAnswerList(undefined);
  }

  function ActionOllama(item?: [string, string, OllamaApiGenerateResponseDone]): JSX.Element {
    if (item) {
      return (
        <ActionPanel>
          <ActionPanel.Section title="Ollama">
            <Action icon={Icon.Star} onAction={Inference} title="Get Answer" />
            <Action.CopyToClipboard content={item[1]} />
            <Action
              title="Clear Conversation"
              onAction={ClearAnswerList}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              icon={Icon.Trash}
            />
          </ActionPanel.Section>
        </ActionPanel>
      );
    }
    return (
      <ActionPanel>
        <ActionPanel.Section title="Ollama">
          <Action icon={Icon.Star} onAction={Inference} title="Get Answer" />
        </ActionPanel.Section>
      </ActionPanel>
    );
  }

  React.useEffect(() => {
    SaveAnswerList();
  }, [answerList]);

  React.useEffect(() => {
    GetAnswerList();
  }, []);

  return (
    <List
      isLoading={loading}
      navigationTitle="Ask..."
      searchBarPlaceholder="Ask..."
      searchText={query}
      onSearchTextChange={setQuery}
      selectedItemId={selectedAnswer}
      actions={!loading && ActionOllama()}
      isShowingDetail={answerList != undefined}
    >
      {(() => {
        if (answerList) {
          return answerList?.map((item, index) => (
            <List.Item
              icon={Icon.Message}
              title={item[0]}
              key={index}
              id={index.toString()}
              actions={!loading && ActionOllama(item)}
              detail={<List.Item.Detail markdown={`${item[1]}`} />}
            />
          ));
        }
        return <List.EmptyView icon={Icon.Message} title="Start a Conversation with Ollama" />;
      })()}
    </List>
  );
}
