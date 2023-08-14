# Raycast Ollama

Use [Ollama](https://ollama.ai) for local llama inference on Raycast.

## Requirements

1. Ollama installed and running.
2. At least orca 3b and llama2 7b model installed (they are the default).

```bash
ollama pull orca
ollama pull llama2
```

## Use a different model

This plugin allows you to select a different model for each command. Keep in mind that you need to have the corresponding model installed on your machine.

Install orca 3b

```bash
ollama pull orca
```

Install llama2 7b

```bash
ollama pull llama2
```

Install llama2 13b

```bash
ollama pull llama2:13b
```

Install llama2 70b

```bash
ollama pull llama2:70b
```

## Create your own custom commands

With '***Create Custom Command***' you can create your own custom command or chatbot using whatever model you want.
