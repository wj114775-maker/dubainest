import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserActionReasonDialog from "@/components/admin/UserActionReasonDialog";

export default function UserLifecycleActionsCard({ securityState, onAction }) {
  const isSuspended = securityState?.is_suspended;
  const isLocked = securityState?.is_locked;

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Lifecycle and security actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <UserActionReasonDialog title={isSuspended ? "Unsuspend user" : "Suspend user"} description="This changes the account security state and writes an audit entry." actionLabel={isSuspended ? "Unsuspend" : "Suspend"} onConfirm={(reason) => onAction(isSuspended ? "unsuspend" : "suspend", reason)}>
          <Button variant={isSuspended ? "outline" : "destructive"}>{isSuspended ? "Unsuspend account" : "Suspend account"}</Button>
        </UserActionReasonDialog>

        <UserActionReasonDialog title="Require password reset" description="The user will be marked for password reset on next secure flow." actionLabel="Require reset" onConfirm={(reason) => onAction("password_reset", reason)}>
          <Button variant="outline">Require password reset</Button>
        </UserActionReasonDialog>

        <UserActionReasonDialog title="Require MFA reset" description="This flags the account for MFA re-enrollment and records the action." actionLabel="Require MFA reset" onConfirm={(reason) => onAction("mfa_reset", reason)}>
          <Button variant="outline">Require MFA reset</Button>
        </UserActionReasonDialog>

        {isLocked ? (
          <UserActionReasonDialog title="Unlock user" description="This clears the locked state and records who approved it." actionLabel="Unlock" onConfirm={(reason) => onAction("unlock", reason)}>
            <Button variant="outline">Unlock account</Button>
          </UserActionReasonDialog>
        ) : null}
      </CardContent>
    </Card>
  );
}