export type ProjectHealthInput = {
  flvParts: ReadonlyArray<unknown>;
  outputMp4Bytes: number | null;
  damaged?: boolean;
};

export type ProjectHealth = "ready" | "needs-compose" | "broken";

export type ProjectInspection = {
  readableFlvCount: number;
  mp4Readable: boolean;
};

export function classifyProject(
  project: ProjectHealthInput,
  readableFlvCount: number,
  mp4Readable: boolean,
): ProjectHealth {
  if (project.damaged) return "broken";
  const listed = project.flvParts.length;
  if (listed > 0 && readableFlvCount !== listed) return "broken";
  if (mp4Readable) return "ready";
  if (listed > 0 && readableFlvCount === listed) return "needs-compose";
  return "broken";
}

export function idsNeedingCompose(
  projects: Array<ProjectHealthInput & { id: string }>,
  inspect: (id: string) => ProjectInspection,
) {
  return projects
    .filter((project) => {
      const found = inspect(project.id);
      return classifyProject(project, found.readableFlvCount, found.mp4Readable) === "needs-compose";
    })
    .map((project) => project.id);
}
