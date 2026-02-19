"use strict";

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");

const ERROR_EMOJI = "<:alert:1474160929133559818>";

function buildErrorV2(message, title = "Error") {
  const text = String(message || "Unknown error.");
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${ERROR_EMOJI} ${title}`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(text)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

module.exports = {
  ERROR_EMOJI,
  buildErrorV2,
};
