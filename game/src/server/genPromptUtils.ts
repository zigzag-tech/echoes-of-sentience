import { z } from "zod";

import {
  GameState,
  actionSchema,
  charactersEnum,
} from "../common/gameStateSchema";
import { Message } from "ollama";
import { characterOutputSchema } from "../common/characterOutputSchema";

export type Action = z.infer<typeof actionSchema>;

export function genPropsPrompt(newScene: string) {
  return [
    {
      role: "system",
      content: `
You are a scene writing assistant. Your job is to write the type, name, description, and position of objects mentioned in the SCENE PROVIDED.

Instructions:
- position should be only one of "north", "west", "south", "east".
- type should be only one of the "person" or "object".
- name and description should be a string.
- Respond with only the JSON and do NOT explain.
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
In a cozy room, Emily sits, a black cat curled at her feet. She tries to get the cat's attention with a toy.

JSON OBJECTS:
`,
    },
    {
      role: "assistant",
      content: `
${JSON.stringify(
  {
    props: [
      {
        type: "person",
        name: "emily",
        description: "emily the cat lover.",
        position: {
          x: 0,
          y: 0,
        },
      },
      {
        type: "object",
        name: "cat",
        description: "A black cat.",
        position: {
          x: 0,
          y: 5,
        },
      },
      {
        type: "object",
        name: "cat toy",
        description: "A round toy with a bell inside.",
        position: {
          x: 5,
          y: 5,
        },
      },
    ],
  },
  null,
  2
)}
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
In the ancient ruins, a group of 3 adventurers, Jack, Tracy, and Indiana, entered a dark chamber. They found a treasure chest and a skeleton.

JSON OBJECTS:
`,
    },
    {
      role: "assistant",
      content: `
${JSON.stringify(
  {
    props: [
      {
        type: "person",
        name: "jack",
        description: "Jack the adventurer.",
        position: {
          x: 0,
          y: 0,
        },
      },
      {
        type: "person",
        name: "tracy",
        description: "Tracy the adventurer.",
        position: {
          x: 5,
          y: 0,
        },
      },
      {
        type: "person",
        name: "indiana",
        description: "Indiana the adventurer.",
        position: {
          x: 5,
          y: 5,
        },
      },
      {
        type: "object",
        name: "treasure chest",
        description: "A large treasure chest.",
        position: {
          x: 2,
          y: 2,
        },
      },
      {
        type: "object",
        name: "skeleton",
        description: "A human skeleton.",
        position: {
          x: 3,
          y: 3,
        },
      },
    ],
  },
  null,
  2
)}
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
${newScene}

JSON OBJECTS:
`,
    },
  ];
}

export function genActionPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const messages: Message[] = [
    {
      role: "system",
      content: `
You are a helpful assistant. Your job is to determine the next activities of the subject based on the context provided.

INSTRUCTIONS:
- Put all activities you think the character should do in the "activities" array.
- Use each SUBJECT ALLOWED ACTIVITIES at most once in your activities.
- Always include a "talk" action with a message in the "activities" array.
- Always include "subject", "reflection" and "activities" in the JSON.
- Respond with ONLY the JSON and do NOT add any notes or comments.
- Be creative and try not to repeat what other characters have already said or done.
`,
    },
    {
      role: "user",
      content: `
CONTEXT:
Emily Loves cats. She is a cat lover and she is always surrounded by cats. 
Her cat is sick. 

OBJECTIVE:
Emily wants catch her cat and take it to the vet.

OBJECTS IN SCENE:
[
    {"type":"person","name":"emily","description":"Emily the cat lover.","position": {"x": 0, "y": 0}},
    {"type":"person","name":"cat","description":"A black cat.","position": {"x": 0, "y": 5}},
]

RECENT ACTIVITY LOG:
cat: [walk_to {"x": 0, "y": 0}]
cat: [talk] Meow!

SUBJECT NAME:
Emily

SUBJECT ALLOWED ACTIVITIES:
[
  {"action": "walk_to", "target": "[sample_destination]"},
  {"action": "look_at", "target": "[sample_target]"},
  {"action": "feed", "target": "[sample_target]"},
  {"action": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTIVITIES:
`,
    },
    {
      role: "assistant",
      content: `
${JSON.stringify(
  {
    subject: "emily",
    reflection: "I am so worried about the cat. Must get her to the vet soon.",
    // intent: "I must catch the cat and take her to the vet.",
    activities: [
      {
        action: "look_at",
        target: "cat",
      },
      {
        action: "talk",
        message: "Hey, kitty! You want some treats?",
      },
    ],
  },
  null,
  2
)}
`,
    },
    {
      role: "user",
      content: `
CONTEXT:
Frodo encounters a green bear on his way to the mountain.

OBJECTIVE:
Frodo tries to get treasure from a legendary mountain.

OBJECTS IN SCENE:
[
    {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position": {"x": 3, "y": 2}},
    {"type":"person","name":"bear","description":"A hungry green bear.","position": {"x": 1, "y": 5}},
]


RECENT ACTIVITY LOG:
frodo: [walk_to {"x": 1, "y": 5}]
bear: [talk] Growl!
bear: [attack frodo]

SUBJECT NAME:
Frodo

SUBJECT ALLOWED ACTIVITIES:
[
    {"action": "shoot", "target": "[some_target]"},
    {"action": "attack", "target": "[some_target]"},
    {"action": "hide", "target": null },
    {"action": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTIVITIES:
`,
    },
    {
      role: "assistant",
      content: `
${JSON.stringify(
  {
    subject: "frodo",
    reflection:
      "Man that didn't work! This bear is distracting me from my goal.",
    // intent: "I must hide from the bear.",
    activities: [
      {
        action: "talk",
        message: "Oh no, the bear didn't die! I must hide!",
      },
      {
        action: "hide",
        target: null,
      },
    ],
  },
  null,
  2
)}
  `,
    },
  ];

  const newUserPrompt = `
CONTEXT:
${state.current.summary}

OBJECTIVE:

OBJECTS IN SCENE:
[
${state.current.props.map((prop) => JSON.stringify(prop)).join(",\n")}
]

RECENT ACTIVITY LOG:
${state.recentHistory
  .flatMap((history) => {
    const actions = history.activities.map((action) => {
      return { ...action, subject: history.subject };
    });
    return actions.map((obj) => {
      const dest = obj.destination
        ? JSON.stringify(obj.destination)
        : obj.target
        ? obj.target
        : "";
      return `${obj.subject}: [${obj.action} ${dest}] ${obj.message || ""}`;
    });
  })
  .join("\n")}

SUBJECT NAME:
${role}

SUBJECT ALLOWED ACTIVITIES:
[
${[
  { action: "talk", message: "[sample_message]", target: null },
  {
    action: "walk_to",
    message: null,
    destination: { x: 1, y: 1 },
    target: null,
  },
  {
    action: "run_to",
    message: null,
    destination: { x: 2, y: 1 },
    target: null,
  },
  { action: "jump", message: null, target: null, destination: null },
  {
    action: "examine",
    message: null,
    target: "[sample_target]",
    destination: null,
  },
  {
    action: "operate",
    message: null,
    target: "[sample_target]",
    destination: null,
  },
  {
    action: "punch",
    message: null,
    target: "[sample_target]",
    destination: null,
  },
  {
    action: "kick",
    message: null,
    target: "[sample_target]",
    destination: null,
  },
  {
    action: "run_to",
    message: null,
    target: "[sample_destination]",
    destination: null,
  },
]
  .map((d) => JSON.stringify(d))
  .join("\n")}
]

SUBJECT NEXT ACTIVITIES:
`;

  messages.push({ role: "user", content: newUserPrompt });
  return messages;
}

export function parseJSONResponse(raw: string) {
  try {
    // heuristic to find the [] enclosure substring
    // note: 03-23 we tried to allow for multiple actions in json response
    // const start = raw.indexOf("{");
    // const end = raw.lastIndexOf("}") + 1;
    // const responseJsonString = raw.slice(start, end);
    const responseJson = JSON.parse(raw.trim()) as z.infer<
      typeof characterOutputSchema
    >;
    return responseJson;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    throw e;
  }
}
