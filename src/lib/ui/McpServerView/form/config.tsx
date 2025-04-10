import { Action, ActionPanel, Form, Icon } from "@raycast/api";
import { useForm } from "@raycast/utils";
import React from "react";
import { McpServerConfig } from "../../../mcp/types";
import { GetInitialValueConfig } from "./function";

interface props {
  setShow: (value: boolean) => void;
  config: McpServerConfig;
  setConfig: (value: McpServerConfig) => Promise<void>;
  configName?: string;
}

interface FormData {
  config: string;
}

export function McpServerFormConfig(props: props): React.JSX.Element {
  const { handleSubmit, itemProps } = useForm<FormData>({
    onSubmit(values) {
      const oldConfig: McpServerConfig = JSON.parse(JSON.stringify(props.config));
      const newConfig: McpServerConfig = JSON.parse(values.config);
      Object.keys(newConfig.mcpServers).forEach((key) => {
        oldConfig.mcpServers[key] = newConfig.mcpServers[key];
      });
      props.setConfig(oldConfig);
      props.setShow(false);
    },
    initialValues: {
      config: GetInitialValueConfig(props.config, props.configName),
    },
    validation: {
      config: ValidateConfig,
    },
  });

  /**
   * Validate JSON Mcp Config.
   * @param value - Mcp Server Config on string format.
   */
  function ValidateConfig(value: string | undefined): string | undefined | null {
    // Exception on undefined value.
    if (!value) return "Empty Config.";

    // Exception on unvalid JSON Mcp Server Config.
    let config: McpServerConfig;
    try {
      config = JSON.parse(value);
    } catch (e) {
      return `Wrong Mcp Server Config JSON Format: ${e}.`;
    }

    // Exception if adding Mcp Server Config with already used name.
    const currentNames = Object.keys(props.config.mcpServers);
    const newNames = Object.keys(config.mcpServers);
    const commonName = currentNames.find(
      (currentName) => newNames.findIndex((newName) => currentName === newName && newName !== props.configName) !== -1
    );
    if (commonName) return `Mcp Server "${commonName}" already configured.`;
  }

  /**
   * Action Menu.
   */
  function ActionMain(): React.JSX.Element {
    return (
      <ActionPanel>
        <Action.SubmitForm onSubmit={handleSubmit} />
        <Action title="Undo" icon={Icon.Undo} onAction={() => props.setShow(false)} />
      </ActionPanel>
    );
  }

  return (
    <Form actions={<ActionMain />}>
      <Form.TextArea
        title="Mcp Server Config"
        info="Copy Mcp Server config in json format"
        autoFocus={true}
        {...itemProps.config}
      />
    </Form>
  );
}
