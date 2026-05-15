### Running locally

Clone the repo and install dependencies:

```bash
git clone https://github.com/SableRaf/opdl.git
cd opdl
npm install
```

Link the package globally so the `opdl` command runs your local source. 

From the project root directory, run:

```bash
npm link
```

You can now run `opdl` from anywhere and it will use your local changes. To unlink when you're done:

```bash
npm unlink -g opdl
```

### Running tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and include a live API integration test that makes real requests to OpenProcessing. Set `OP_API_KEY` before running tests to avoid rate limiting:

```bash
OP_API_KEY=YOUR_API_TOKEN npm test
```
