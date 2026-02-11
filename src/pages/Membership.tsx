import { useState } from "react";
import { User } from "lucide-react";
import { format } from "date-fns";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { usePublicMembershipTypes, usePublicMembers } from "@/hooks/usePublicMembers";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Membership = () => {
  const [activeType, setActiveType] = useState<string | undefined>(undefined);
  const { data: membershipTypes = [], isLoading: typesLoading } = usePublicMembershipTypes();
  const { data: members = [], isLoading: membersLoading } = usePublicMembers(activeType);

  const activeTypeName = activeType
    ? membershipTypes.find((t) => t.id === activeType)?.name
    : "All";

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Our Members
          </h1>
          <p className="text-sm text-muted-foreground tracking-wider uppercase">
            Meet the community
          </p>
        </div>

        {/* Membership Type Filter Tabs */}
        {!typesLoading && membershipTypes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveType(undefined)}
              className={`px-5 py-2 text-xs font-semibold tracking-wider uppercase border transition-colors ${
                !activeType
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground"
              }`}
            >
              All
            </button>
            {membershipTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`px-5 py-2 text-xs font-semibold tracking-wider uppercase border transition-colors ${
                  activeType === type.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        )}

        {/* Members Grid */}
        {membersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
            {members.map((member) => {
              const ct = Array.isArray(member.customer_type)
                ? member.customer_type[0]
                : member.customer_type;
              return (
                <div
                  key={member.id}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Avatar */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-border bg-muted mb-3 flex items-center justify-center">
                    {member.profile_image_url ? (
                      <img
                        src={member.profile_image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" strokeWidth={1} />
                    )}
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold text-foreground tracking-wide">
                    {member.name}
                  </p>

                  {/* Membership Badge */}
                  {ct && (
                    <Badge variant="secondary" className="mt-1 text-[10px] tracking-wider uppercase">
                      {ct.name}
                    </Badge>
                  )}

                  {/* Member Since */}
                  {ct?.show_member_since && member.membership_assigned_at && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Member since {format(new Date(member.membership_assigned_at), "MMM yyyy")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <User className="mx-auto w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm tracking-wider uppercase">
              {activeType ? `No members in ${activeTypeName} yet` : "No members to display yet"}
            </p>
          </div>
        )}
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default Membership;
