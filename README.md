A chrome plugin to make ChatGPT's output look like a ransom note, inspired by [Language models can only write ransom notes](https://posts.decontextualize.com/language-models-ransom-notes/) by the always-insightful Allison Parrish.

Work in progress. I thought this would take me a few hours, but I'm having trouble with being able to get the "cutouts" rotated using only CSS (and I was trying to use only CSS so that it would be easy to toggle on and off) so I put in a repository so I can come back to it. 

As of [March 7 2024](https://github.com/stringertheory/llm-ransom-note-plugin/commits/main/), it looks like this:

<img width="745" alt="image" src="https://github.com/stringertheory/llm-ransom-note-plugin/assets/1110950/c74aebc3-fe83-4c5e-aa6e-3aed50663c17">

Now, a couple years later, I fixed it up, updated the cutout styles/colors, and added options between using tokens or letters for cutouts. I'm using [`gpt-tokenizer`](https://www.npmjs.com/package/gpt-tokenizer) so, in token mode, each cutout is an actual token.

Now, as of May 19 2026, it looks like this:

<img width="685" height="348" alt="image" src="https://github.com/user-attachments/assets/cb33c393-7789-4983-9f8d-401ddcafa85b" />
