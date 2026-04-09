import React, { useMemo, useState } from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { compactLabel } from "@/lib/revenue";

function splitCsvLine(line = "") {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, "").trim());
}

function parseBulkCsv(text = "") {
  const rows = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (rows.length < 2) return { projectAssignments: [], listingAssignments: [] };

  const headers = splitCsvLine(rows[0]).map((header) => header.trim().toLowerCase());
  const projectAssignments = [];
  const listingAssignments = [];

  rows.slice(1).forEach((row) => {
    const values = splitCsvLine(row);
    const record = headers.reduce((accumulator, header, index) => {
      accumulator[header] = values[index] || "";
      return accumulator;
    }, {});

    const type = String(record.type || "").trim().toLowerCase();
    if (type === "project" && record.id) {
      projectAssignments.push({
        projectId: record.id,
        developerOrganisationId: record.developer_organisation_id || "",
      });
    }
    if (type === "listing" && record.id) {
      listingAssignments.push({
        listingId: record.id,
        developerOrganisationId: record.developer_organisation_id || "",
        projectId: record.project_id || "",
      });
    }
  });

  return { projectAssignments, listingAssignments };
}

export default function DeveloperInventoryTab({
  inventory,
  organisations = [],
  projects = [],
  listings = [],
  loading = false,
  onReassignProject,
  onReassignListing,
  onBulkReassign,
}) {
  const [projectAssignments, setProjectAssignments] = useState({});
  const [listingDeveloperAssignments, setListingDeveloperAssignments] = useState({});
  const [listingProjectAssignments, setListingProjectAssignments] = useState({});
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedListingIds, setSelectedListingIds] = useState([]);
  const [bulkProjectDeveloperId, setBulkProjectDeveloperId] = useState("unassigned");
  const [bulkListingDeveloperId, setBulkListingDeveloperId] = useState("keep");
  const [bulkListingProjectId, setBulkListingProjectId] = useState("keep");
  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState("");

  const listingById = useMemo(() => Object.fromEntries(listings.map((listing) => [listing.id, listing])), [listings]);
  const projectById = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);
  const problemListings = useMemo(() => {
    const items = [...inventory.orphanListings, ...inventory.listingsWithoutProject];
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }, [inventory.listingsWithoutProject, inventory.orphanListings]);

  const toggleSelection = (current, id) => (
    current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
  );

  const handleBulkSelectionApply = () => {
    const projectPayloads = selectedProjectIds.map((projectId) => ({
      projectId,
      developerOrganisationId: bulkProjectDeveloperId === "unassigned" ? "" : bulkProjectDeveloperId,
    }));

    const listingPayloads = selectedListingIds.map((listingId) => {
      const listing = listingById[listingId];
      return {
        listingId,
        developerOrganisationId: bulkListingDeveloperId === "keep"
          ? (listing?.developer_organisation_id || listing?.developer_id || "")
          : bulkListingDeveloperId === "unassigned"
            ? ""
            : bulkListingDeveloperId,
        projectId: bulkListingProjectId === "keep"
          ? (listing?.project_id || "")
          : bulkListingProjectId === "unassigned"
            ? ""
            : bulkListingProjectId,
      };
    });

    onBulkReassign?.({ projectAssignments: projectPayloads, listingAssignments: listingPayloads });
    setSelectedProjectIds([]);
    setSelectedListingIds([]);
  };

  const handleCsvApply = () => {
    try {
      const payload = parseBulkCsv(csvText);
      if (!payload.projectAssignments.length && !payload.listingAssignments.length) {
        setCsvError("Paste CSV with a header row and at least one type,id mapping.");
        return;
      }
      setCsvError("");
      onBulkReassign?.(payload);
      setCsvText("");
    } catch {
      setCsvError("CSV could not be parsed. Check the header row and quoting.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orphan projects</p><p className="mt-3 text-3xl font-semibold">{inventory.orphanProjects.length}</p></CardContent></Card>
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orphan listings</p><p className="mt-3 text-3xl font-semibold">{inventory.orphanListings.length}</p></CardContent></Card>
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Listings without project</p><p className="mt-3 text-3xl font-semibold">{inventory.listingsWithoutProject.length}</p></CardContent></Card>
      </div>

      {!inventory.tree.length && !inventory.orphanProjects.length && !problemListings.length ? (
        <EmptyStateCard title="No developer inventory yet" description="Projects and listings will appear here once linked to a signed developer." />
      ) : null}

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Inventory ownership map</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {inventory.tree.map((entry) => (
            <details key={entry.organisation.id} className="rounded-2xl border border-white/10 p-4" open>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entry.organisation.trading_name || entry.organisation.legal_name}</p>
                    <p className="text-sm text-muted-foreground">{entry.projects.length} projects · {entry.projects.reduce((total, projectEntry) => total + projectEntry.listings.length, 0)} linked listings</p>
                  </div>
                  <Badge variant="outline">{compactLabel(entry.organisation.status)}</Badge>
                </div>
              </summary>
              <div className="mt-4 space-y-4">
                {entry.projects.length ? entry.projects.map((projectEntry) => {
                  const project = projectEntry.project;
                  const selectedDeveloperId = projectAssignments[project.id] ?? project.developer_organisation_id ?? project.developer_id ?? "unassigned";
                  return (
                    <Card key={project.id} className="rounded-[1.5rem] border-white/10 bg-background/70">
                      <CardContent className="space-y-4 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{compactLabel(project.status)} · {projectEntry.listings.length} listings</p>
                          </div>
                          <div className="flex min-w-[320px] flex-wrap items-center gap-2">
                            <Select value={selectedDeveloperId || "unassigned"} onValueChange={(value) => setProjectAssignments((current) => ({ ...current, [project.id]: value }))}>
                              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {organisations.map((organisation) => (
                                  <SelectItem key={organisation.id} value={organisation.id}>
                                    {organisation.trading_name || organisation.legal_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={() => onReassignProject?.({ projectId: project.id, developerOrganisationId: selectedDeveloperId === "unassigned" ? "" : selectedDeveloperId })} disabled={loading}>
                              Reassign project
                            </Button>
                          </div>
                        </div>

                        {projectEntry.listings.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Listing</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Developer</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {projectEntry.listings.map((listing) => {
                                const selectedProjectId = listingProjectAssignments[listing.id] ?? listing.project_id ?? project.id;
                                const selectedDeveloperIdForListing = listingDeveloperAssignments[listing.id] ?? listing.developer_organisation_id ?? listing.developer_id ?? entry.organisation.id;
                                return (
                                  <TableRow key={listing.id}>
                                    <TableCell className="font-medium">{listing.title}</TableCell>
                                    <TableCell>{compactLabel(listing.status)}</TableCell>
                                    <TableCell>
                                      <Select value={selectedProjectId || "unassigned"} onValueChange={(value) => setListingProjectAssignments((current) => ({ ...current, [listing.id]: value }))}>
                                        <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="unassigned">No project</SelectItem>
                                          {projects.map((projectOption) => (
                                            <SelectItem key={projectOption.id} value={projectOption.id}>
                                              {projectOption.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Select value={selectedDeveloperIdForListing || "unassigned"} onValueChange={(value) => setListingDeveloperAssignments((current) => ({ ...current, [listing.id]: value }))}>
                                        <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="unassigned">Unassigned</SelectItem>
                                          {organisations.map((organisation) => (
                                            <SelectItem key={organisation.id} value={organisation.id}>
                                              {organisation.trading_name || organisation.legal_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button size="sm" variant="outline" onClick={() => onReassignListing?.({
                                        listingId: listing.id,
                                        projectId: selectedProjectId === "unassigned" ? "" : selectedProjectId,
                                        developerOrganisationId: selectedDeveloperIdForListing === "unassigned" ? "" : selectedDeveloperIdForListing,
                                      })} disabled={loading}>
                                        Reassign listing
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : <p className="text-sm text-muted-foreground">No listings linked.</p>}
                      </CardContent>
                    </Card>
                  );
                }) : <p className="text-sm text-muted-foreground">No projects linked yet.</p>}

                {entry.listingsWithoutProject.length ? (
                  <Card className="rounded-[1.5rem] border-amber-300/60 bg-amber-50">
                    <CardHeader><CardTitle className="text-lg text-amber-950">Listings without project</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Listing</TableHead>
                            <TableHead>Developer</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entry.listingsWithoutProject.map((listing) => {
                            const selectedProjectId = listingProjectAssignments[listing.id] ?? "unassigned";
                            const selectedDeveloperIdForListing = listingDeveloperAssignments[listing.id] ?? listing.developer_organisation_id ?? listing.developer_id ?? entry.organisation.id;
                            return (
                              <TableRow key={listing.id}>
                                <TableCell className="font-medium">{listing.title}</TableCell>
                                <TableCell>
                                  <Select value={selectedDeveloperIdForListing || "unassigned"} onValueChange={(value) => setListingDeveloperAssignments((current) => ({ ...current, [listing.id]: value }))}>
                                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">Unassigned</SelectItem>
                                      {organisations.map((organisation) => (
                                        <SelectItem key={organisation.id} value={organisation.id}>
                                          {organisation.trading_name || organisation.legal_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select value={selectedProjectId || "unassigned"} onValueChange={(value) => setListingProjectAssignments((current) => ({ ...current, [listing.id]: value }))}>
                                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">No project</SelectItem>
                                      {projects.map((projectOption) => (
                                        <SelectItem key={projectOption.id} value={projectOption.id}>
                                          {projectOption.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => onReassignListing?.({
                                    listingId: listing.id,
                                    projectId: selectedProjectId === "unassigned" ? "" : selectedProjectId,
                                    developerOrganisationId: selectedDeveloperIdForListing === "unassigned" ? "" : selectedDeveloperIdForListing,
                                  })} disabled={loading}>
                                    Reassign listing
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </details>
          ))}

          {inventory.orphanProjects.length ? (
            <Card className="rounded-[1.5rem] border-amber-300/60 bg-amber-50">
              <CardHeader><CardTitle className="text-lg text-amber-950">Projects without developer</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.orphanProjects.map((project) => {
                      const selectedDeveloperId = projectAssignments[project.id] ?? "unassigned";
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Checkbox checked={selectedProjectIds.includes(project.id)} onCheckedChange={() => setSelectedProjectIds((current) => toggleSelection(current, project.id))} />
                          </TableCell>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <Select value={selectedDeveloperId || "unassigned"} onValueChange={(value) => setProjectAssignments((current) => ({ ...current, [project.id]: value }))}>
                              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {organisations.map((organisation) => (
                                  <SelectItem key={organisation.id} value={organisation.id}>
                                    {organisation.trading_name || organisation.legal_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => onReassignProject?.({ projectId: project.id, developerOrganisationId: selectedDeveloperId === "unassigned" ? "" : selectedDeveloperId })} disabled={loading}>
                              Reassign project
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          {problemListings.length ? (
            <Card className="rounded-[1.5rem] border-amber-300/60 bg-amber-50">
              <CardHeader><CardTitle className="text-lg text-amber-950">Listings needing linkage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Listing</TableHead>
                      <TableHead>Current project</TableHead>
                      <TableHead>Current developer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox checked={selectedListingIds.includes(listing.id)} onCheckedChange={() => setSelectedListingIds((current) => toggleSelection(current, listing.id))} />
                        </TableCell>
                        <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>{projectById[listing.project_id]?.name || "Unassigned"}</TableCell>
                        <TableCell>{organisations.find((organisation) => organisation.id === (listing.developer_organisation_id || listing.developer_id))?.trading_name || "Unassigned"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Bulk reassignment tools</CardTitle></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-[1.5rem] border-white/10 bg-background/70">
                <CardHeader><CardTitle className="text-lg">Selected projects</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedProjectIds.length} projects selected.</p>
                  <Select value={bulkProjectDeveloperId} onValueChange={setBulkProjectDeveloperId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {organisations.map((organisation) => (
                        <SelectItem key={organisation.id} value={organisation.id}>
                          {organisation.trading_name || organisation.legal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card className="rounded-[1.5rem] border-white/10 bg-background/70">
                <CardHeader><CardTitle className="text-lg">Selected listings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedListingIds.length} listings selected.</p>
                  <Select value={bulkListingDeveloperId} onValueChange={setBulkListingDeveloperId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep current developer</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {organisations.map((organisation) => (
                        <SelectItem key={organisation.id} value={organisation.id}>
                          {organisation.trading_name || organisation.legal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={bulkListingProjectId} onValueChange={setBulkListingProjectId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep current project</SelectItem>
                      <SelectItem value="unassigned">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
            <Button onClick={handleBulkSelectionApply} disabled={loading || (!selectedProjectIds.length && !selectedListingIds.length)}>
              Apply selection-based reassignment
            </Button>
          </div>

          <Card className="rounded-[1.5rem] border-white/10 bg-background/70">
            <CardHeader><CardTitle className="text-lg">Bulk reassign by CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Use headers <code>type,id,developer_organisation_id,project_id</code>. Supported types: <code>project</code> and <code>listing</code>.
              </p>
              <Textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} className="min-h-52 font-mono text-xs" placeholder={`type,id,developer_organisation_id,project_id\nproject,proj_123,dev_001,\nlisting,list_456,dev_001,proj_123`} disabled={loading} />
              {csvError ? <p className="text-sm text-destructive">{csvError}</p> : null}
              <Button variant="outline" onClick={handleCsvApply} disabled={loading || !csvText.trim()}>
                Apply CSV reassignment
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
