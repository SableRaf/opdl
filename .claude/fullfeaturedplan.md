Plan for full-featured `opdl` CLI with field selection and multiple entities.

---

* **Entities**: `sketch`, `user`, `curation`
* **List endpoints** get their own field sets, named as `<entity>.<relation>` (example: `user.sketches`)
* `--info` always means “select output fields” (for a single object or per item in an array)
* `fields` is discovery only

---

## Field discovery

| Goal                                      | Syntax                          | Output                                                                                                 |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| List all field sets                       | `opdl fields`                   | `sketch`, `user`, `curation`, `user.sketches`, `user.followers`, `user.following`, `curation.sketches` |
| Fields for sketch object                  | `opdl fields sketch`            | all fields available on `/api/sketch/:id` (or whatever sketch endpoint you use)                        |
| Fields for user object                    | `opdl fields user`              | fields from `/api/user/:id`                                                                            |
| Fields for curation object                | `opdl fields curation`          | fields from `/api/curation/:id`                                                                        |
| Fields for user’s sketches list items     | `opdl fields user.sketches`     | fields per item from `/api/user/:id/sketches`                                                          |
| Fields for user followers list items      | `opdl fields user.followers`    | fields per item from `/api/user/:id/followers`                                                         |
| Fields for user following list items      | `opdl fields user.following`    | fields per item from `/api/user/:id/following`                                                         |
| Fields for curation’s sketches list items | `opdl fields curation.sketches` | fields per item from `/api/curation/:id/sketches`                                                      |

If you later add more list endpoints, this naming holds up: `sketch.forks`, `sketch.comments`, etc.

---

## Sketch commands

| Goal                                    | Syntax                                                        | Notes         |
| --------------------------------------- | ------------------------------------------------------------- | ------------- |
| Download sketch (shortcut, current)     | `opdl <sketchId> [--outputDir=dir] [--quiet]`                 | Keep this     |
| Download sketch (explicit)              | `opdl sketch download <sketchId> [--outputDir=dir] [--quiet]` | Scales        |
| Print selected sketch fields            | `opdl <sketchId> --info title,license,libraries`              | Shortcut form |
| Print selected sketch fields (explicit) | `opdl sketch info <sketchId> --info title,license`            | Same behavior |
| Print all sketch fields                 | `opdl <sketchId> --info all`                                  | Convenience   |

Optional (nice later): `opdl sketch open <sketchId>` (open OP page).

---

## User commands

| Goal                       | Syntax                                                                     | Notes         |
| -------------------------- | -------------------------------------------------------------------------- | ------------- |
| Print selected user fields | `opdl user <userId> --info fullname,website,memberSince`                   | Single object |
| Print all user fields      | `opdl user <userId> --info all`                                            | Single object |
| List user sketches         | `opdl user sketches <userId> [--limit N] [--offset N] [--sort asc\|desc]`  | Array         |
| List followers             | `opdl user followers <userId> [--limit N] [--offset N] [--sort asc\|desc]` | Array         |
| List following             | `opdl user following <userId> [--limit N] [--offset N] [--sort asc\|desc]` | Array         |

Optional but consistent: allow `--info` on list commands to select per-item fields:

```
opdl user sketches 1 --info visualID,title
opdl user followers 1 --info userID,fullname,followedOn
```

---

## Curation commands

(Exact endpoint names may differ, but the CLI shape can stay stable.)

| Goal                           | Syntax                                                                            | Notes                                      |
| ------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------ |
| Print selected curation fields | `opdl curation <curationId> --info title,description,createdOn`                   | Single object                              |
| Print all curation fields      | `opdl curation <curationId> --info all`                                           | Single object                              |
| List sketches in a curation    | `opdl curation sketches <curationId> [--limit N] [--offset N] [--sort asc\|desc]` | Array (maps to curation sketches endpoint) |

And again, optional selection on the list:

```
opdl curation sketches <curationId> --info visualID,title,submittedOn
```

---

## Global flags (by command type)

### Applies to everything that prints

* `--info <csv|all>`
* `--json` (strongly recommend adding this)
* `--quiet`

### Applies to list commands

* `--limit`
* `--offset`
* `--sort asc|desc`

### Applies to download only

* `--outputDir`
* your current download-related options (`--downloadThumbnail`, `--saveMetadata`, etc.)

---

## Concrete examples

### Discoverability

```
opdl fields
opdl fields sketch
opdl fields user.followers
opdl fields curation.sketches
```

### Sketch info vs download

```
opdl 1142958 --info title,license
opdl 1142958 --outputDir=./emojisweeper
opdl sketch download 1142958 --outputDir=./emojisweeper
```

### User

```
opdl user 1 --info fullname,website
opdl user sketches 1 --limit 10 --sort desc --info visualID,title
```

### Curation

```
opdl curation 12 --info title,description
opdl curation sketches 12 --limit 20 --sort desc --info visualID,title
```

---

## Reserve shortcut IDs for sketch only

Keep `opdl <id>` meaning “sketch”, because that is already your tool’s identity (downloader). For `user` and `curation`, require the explicit entity keyword. That avoids ambiguity later if IDs overlap in format.


---

## Next steps (after this plan)

This is not to be implemented now, but the following features should be considered for future versions and must be compatible with the work described above.

1. Add --vite option to download command to generate Vite project structure for JS sketches.
2. Support multiple IDs in download command to batch download sketches.
3. Allow downloading only specific file groups (code, assets, metadata).