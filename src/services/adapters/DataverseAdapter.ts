// Leave Management App - Dataverse Adapter
// Implements DataSourceAdapter using generated PAC CLI services

import type { DataSourceAdapter } from './DataSourceAdapter';
import type {
    LeaveRequest,
    LeaveBalance,
    LeaveType,
    PublicHoliday,
    CreateLeaveRequest,
    LeaveRequestFilters,
    LeaveStatus,
    AppSetting,
    CurrentUser,
    TeamMember,
} from '@/types';

import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { mockTeamMembers } from '@/lib/mockData';

// Import generated services
import { Lm_leavetypesService } from '@/generated/services/Lm_leavetypesService';
import { Lm_leaverequestsService } from '@/generated/services/Lm_leaverequestsService';
import { Lm_leavebalancesService } from '@/generated/services/Lm_leavebalancesService';
import { Lm_publicholidaiesService } from '@/generated/services/Lm_publicholidaiesService';
import { Lm_appsettingsService } from '@/generated/services/Lm_appsettingsService';

// Import generated models
import type { Lm_leavetypes } from '@/generated/models/Lm_leavetypesModel';
import type { Lm_leaverequests } from '@/generated/models/Lm_leaverequestsModel';
import type { Lm_leavebalances } from '@/generated/models/Lm_leavebalancesModel';
import type { Lm_publicholidaies } from '@/generated/models/Lm_publicholidaiesModel';
import type { Lm_appsettings } from '@/generated/models/Lm_appsettingsModel';

/**
 * Maps Dataverse LeaveType record to app LeaveType
 */
function mapLeaveType(record: Lm_leavetypes): LeaveType {
    return {
        id: record.lm_leavetypeid,
        name: record.lm_name,
        code: record.lm_code,
        color: record.lm_color || '#6366f1',
        icon: record.lm_icon || 'calendar',
        requiresApproval: record.lm_requiresapproval === 1,
        maxDaysPerRequest: record.lm_maxdaysperrequest ? parseInt(record.lm_maxdaysperrequest) : null,
        isActive: record.lm_isactive === 1,
        sortOrder: record.lm_sortorder ? parseInt(record.lm_sortorder) : 0,
    };
}

/**
 * Maps Dataverse LeaveRequest record to app LeaveRequest
 * Note: leaveTypeId stored in reason field as [LEAVETYPE:id] until lookup column added
 */
function mapLeaveRequest(record: Lm_leaverequests, leaveTypes?: LeaveType[]): LeaveRequest {
    // Extract leave type ID from reason field pattern [LEAVETYPE:id]
    const leaveTypeMatch = record.lm_reason?.match(/\[LEAVETYPE:([^\]]+)\]/);
    const leaveTypeId = leaveTypeMatch?.[1] || '';
    const leaveType = leaveTypes?.find(lt => lt.id === leaveTypeId);

    // Map status from Dataverse statuscode to app LeaveStatus
    // Default Dataverse statuscodes: 1=Active, 2=Inactive
    // We use the reason field pattern [STATUS:pending|approved|rejected|cancelled]
    const statusMatch = record.lm_reason?.match(/\[STATUS:(\w+)\]/);
    const status = (statusMatch?.[1] as LeaveStatus) || 'pending';

    // Clean reason by removing our metadata tags
    const cleanReason = record.lm_reason
        ?.replace(/\[LEAVETYPE:[^\]]+\]\s*/g, '')
        .replace(/\[STATUS:\w+\]\s*/g, '')
        .trim() || undefined;

    return {
        id: record.lm_leaverequestid,
        employeeId: record.lm_employeeid,
        employeeEmail: record.lm_employeeemail || '',
        employeeName: record.lm_employeename || '',
        leaveTypeId,
        leaveType,
        startDate: new Date(record.lm_startdate || ''),
        endDate: new Date(record.lm_enddate || ''),
        halfDayStart: record.lm_halfdaystart === 1,
        halfDayEnd: record.lm_halfdayend === 1,
        totalDays: parseFloat(record.lm_totaldays || '0'),
        reason: cleanReason,
        status,
        approverId: record.lm_approverid,
        approverName: record.lm_approvername,
        approverComments: record.lm_approvercomments,
        approvedAt: record.lm_approvedat ? new Date(record.lm_approvedat) : undefined,
        createdAt: new Date(record.createdon || ''),
        updatedAt: new Date(record.modifiedon || ''),
    };
}

/**
 * Maps Dataverse LeaveBalance record to app LeaveBalance
 * Note: Name field pattern: {employeeId}-{leaveTypeCode}-{year}
 */
function mapLeaveBalance(record: Lm_leavebalances, leaveTypes?: LeaveType[]): LeaveBalance {
    // Extract leave type from name pattern: employeeId-leaveTypeCode-year
    const nameParts = record.lm_name?.split('-') || [];
    const leaveTypeCode = nameParts.length >= 2 ? nameParts[1] : '';
    const leaveType = leaveTypes?.find(lt => lt.code === leaveTypeCode);

    const entitlement = parseFloat(record.lm_entitlement || '0');
    const used = parseFloat(record.lm_used || '0');
    const pending = parseFloat(record.lm_pending || '0');
    const carryOver = parseFloat(record.lm_carryover || '0');

    return {
        id: record.lm_leavebalanceid,
        employeeId: record.lm_employeeid,
        leaveTypeId: leaveType?.id || '',
        leaveType,
        year: parseInt(record.lm_year || new Date().getFullYear().toString()),
        entitlement,
        used,
        pending,
        carryOver,
        available: entitlement + carryOver - used - pending,
    };
}

/**
 * Maps Dataverse PublicHoliday record to app PublicHoliday
 */
function mapPublicHoliday(record: Lm_publicholidaies): PublicHoliday {
    return {
        id: record.lm_publicholidayid,
        name: record.lm_name,
        date: new Date(record.lm_date || ''),
        region: record.lm_region || 'GB',
        isRecurring: record.lm_isrecurring === 1,
    };
}

/**
 * Maps Dataverse AppSetting record to app AppSetting
 * Note: Category is derived from key prefix (general_, leave_, approval_, ai_)
 */
function mapAppSetting(record: Lm_appsettings): AppSetting {
    // Extract category from key prefix
    const categoryMatch = record.lm_key?.match(/^(general|leave|approval|ai)_/);
    const category = (categoryMatch?.[1] as AppSetting['category']) || 'general';

    return {
        key: record.lm_key,
        value: record.lm_value || '',
        category,
    };
}

/**
 * Dataverse implementation of DataSourceAdapter
 * Uses Power Apps generated services for data access
 */
export class DataverseAdapter implements DataSourceAdapter {
    readonly name = 'dataverse';

    // Cache for leave types to avoid repeated fetches
    private leaveTypesCache: LeaveType[] | null = null;

    private async getLeaveTypesCache(): Promise<LeaveType[]> {
        if (!this.leaveTypesCache) {
            this.leaveTypesCache = await this.getLeaveTypes();
        }
        return this.leaveTypesCache;
    }

    async getCurrentUser(): Promise<CurrentUser | null> {
        // 1. Try to get context from Xrm (Power Apps environment)
        const xrm = (window as any).Xrm;

        let globalContext: any;
        try {
            globalContext = xrm?.Utility?.getGlobalContext();
        } catch (error) {
            console.warn('Failed to get Xrm global context:', error);
        }

        // Clean ID: removing braces if present
        const userId = globalContext?.userSettings?.userId?.replace(/[{}]/g, '').toLowerCase();
        const userName = globalContext?.userSettings?.userName;

        if (userId) {
            // Use Xrm.WebApi for systemuser queries — systemuser is a system table
            // not registered in dataSourcesInfo, so getClient() cannot access it
            if (xrm?.WebApi) {
                try {
                    const result = await xrm.WebApi.retrieveRecord(
                        'systemuser',
                        userId,
                        '?$select=fullname,firstname,lastname,internalemailaddress,jobtitle,address1_city'
                    );

                    if (result) {
                        return {
                            id: userId,
                            displayName: result.fullname || userName || 'User',
                            email: result.internalemailaddress || '',
                            firstName: result.firstname,
                            lastName: result.lastname,
                            jobTitle: result.jobtitle,
                            department: result.address1_city,
                            isManager: false,
                            isAdmin: false,
                            roles: ['employee'],
                            directReports: [],
                            teamMembers: []
                        };
                    }
                } catch (error) {
                    console.warn('Failed to fetch systemuser details via Xrm.WebApi, falling back to basic context', error);
                }
            }

            // Basic fallback from Xrm context
            return {
                id: userId,
                displayName: userName || 'Power Apps User',
                email: '',
                isManager: false,
                isAdmin: false,
                roles: ['employee'],
                directReports: [],
                teamMembers: []
            };
        }

        // 2. Fallback for Local Dev (when not in Power Apps)
        console.log('No Dataverse context found (Xrm). Using mock user for local dev.');
        const mockUser = mockTeamMembers[0];
        return {
            ...mockUser,
            roles: ['admin', 'manager', 'employee'],
            directReports: [],
            teamMembers: []
        };
    }

    async getTeamMembers(): Promise<TeamMember[]> {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return [];

            const xrm = (window as any).Xrm;

            // Use Xrm.WebApi for systemuser queries — systemuser is a system table
            // not registered in dataSourcesInfo, so getClient() cannot access it
            if (xrm?.WebApi) {
                const result = await xrm.WebApi.retrieveMultipleRecords(
                    'systemuser',
                    `?$filter=_parentsystemuserid_value eq '${currentUser.id}'&$select=systemuserid,fullname,firstname,lastname,internalemailaddress,jobtitle,address1_city`
                );

                if (result?.entities) {
                    return result.entities.map((u: any) => ({
                        id: u.systemuserid,
                        displayName: u.fullname || 'Unknown',
                        email: u.internalemailaddress || '',
                        firstName: u.firstname,
                        lastName: u.lastname,
                        jobTitle: u.jobtitle,
                        department: u.address1_city,
                        isManager: false,
                        isAdmin: false,
                        currentStatus: 'available' as const,
                    }));
                }
            }

            // Local dev fallback: return mock team members (excluding the current user)
            if (!xrm) {
                return mockTeamMembers
                    .filter(m => m.id !== currentUser.id)
                    .map(m => ({ ...m }));
            }

            return [];
        } catch (error) {
            console.warn('Failed to fetch team members:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Leave Requests
    // ─────────────────────────────────────────────────────────────

    async getLeaveRequests(filters?: LeaveRequestFilters): Promise<LeaveRequest[]> {
        const leaveTypes = await this.getLeaveTypesCache();

        // Build OData filter string
        const filterParts: string[] = [];

        if (filters?.employeeId) {
            filterParts.push(`lm_employeeid eq '${filters.employeeId}'`);
        }
        if (filters?.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            const statusMap: Record<LeaveStatus, number> = {
                pending: 1,
                approved: 2,
                rejected: 3,
                cancelled: 4,
            };
            const statusCodes = statuses.map(s => statusMap[s]);
            if (statusCodes.length === 1) {
                filterParts.push(`statuscode eq ${statusCodes[0]}`);
            } else {
                const statusFilter = statusCodes.map(c => `statuscode eq ${c}`).join(' or ');
                filterParts.push(`(${statusFilter})`);
            }
        }
        if (filters?.leaveTypeId) {
            filterParts.push(`_lm_leavetype_value eq ${filters.leaveTypeId}`);
        }
        if (filters?.approverId) {
            filterParts.push(`lm_approverid eq '${filters.approverId}'`);
        }
        if (filters?.startDate) {
            filterParts.push(`lm_startdate ge ${filters.startDate.toISOString()}`);
        }
        if (filters?.endDate) {
            filterParts.push(`lm_enddate le ${filters.endDate.toISOString()}`);
        }

        const options = filterParts.length > 0
            ? { filter: filterParts.join(' and ') }
            : undefined;

        const result = await Lm_leaverequestsService.getAll(options);
        return (result.data || []).map(r => mapLeaveRequest(r, leaveTypes));
    }

    async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
        try {
            const leaveTypes = await this.getLeaveTypesCache();
            const result = await Lm_leaverequestsService.get(id);
            return result.data ? mapLeaveRequest(result.data, leaveTypes) : null;
        } catch {
            return null;
        }
    }

    async createLeaveRequest(request: CreateLeaveRequest, employeeId: string): Promise<LeaveRequest> {
        const leaveTypes = await this.getLeaveTypesCache();

        // Calculate total days (simple calculation - can be enhanced)
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (request.halfDayStart) totalDays -= 0.5;
        if (request.halfDayEnd) totalDays -= 0.5;

        // Encode leave type ID and status in reason field (until lookup columns added)
        const reasonWithMetadata = `[LEAVETYPE:${request.leaveTypeId}][STATUS:pending] ${request.reason || ''}`.trim();

        const result = await Lm_leaverequestsService.create({
            lm_employeeid: employeeId,
            lm_employeename: '', // Will be populated from user context
            lm_startdate: request.startDate.toISOString(),
            lm_enddate: request.endDate.toISOString(),
            lm_halfdaystart: request.halfDayStart ? 1 : 0,
            lm_halfdayend: request.halfDayEnd ? 1 : 0,
            lm_totaldays: totalDays.toString(),
            lm_reason: reasonWithMetadata,
            ownerid: employeeId,
            owneridtype: 'systemuser',
            statecode: 0,
        } as any);

        return mapLeaveRequest(result.data, leaveTypes);
    }

    async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
        const leaveTypes = await this.getLeaveTypesCache();

        // First get the current record to update reason field metadata
        const current = await Lm_leaverequestsService.get(id);
        let currentReason = current.data?.lm_reason || '';

        // Map app fields to Dataverse fields
        const dvUpdates: Record<string, any> = {};

        // Update status in reason field metadata tag
        if (updates.status) {
            currentReason = currentReason.replace(/\[STATUS:\w+\]/, `[STATUS:${updates.status}]`);
            dvUpdates.lm_reason = currentReason;
        }

        if (updates.approverId !== undefined) dvUpdates.lm_approverid = updates.approverId;
        if (updates.approverName !== undefined) dvUpdates.lm_approvername = updates.approverName;
        if (updates.approverComments !== undefined) dvUpdates.lm_approvercomments = updates.approverComments;
        if (updates.approvedAt !== undefined) dvUpdates.lm_approvedat = updates.approvedAt?.toISOString();

        const result = await Lm_leaverequestsService.update(id, dvUpdates);
        return mapLeaveRequest(result.data, leaveTypes);
    }

    async deleteLeaveRequest(id: string): Promise<void> {
        await Lm_leaverequestsService.delete(id);
    }

    // ─────────────────────────────────────────────────────────────
    // Leave Balances
    // ─────────────────────────────────────────────────────────────

    async getLeaveBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
        const leaveTypes = await this.getLeaveTypesCache();

        const result = await Lm_leavebalancesService.getAll({
            filter: `lm_employeeid eq '${employeeId}' and lm_year eq ${year}`,
        });

        return (result.data || []).map(r => mapLeaveBalance(r, leaveTypes));
    }

    async updateLeaveBalance(id: string, updates: Partial<LeaveBalance>): Promise<LeaveBalance> {
        const leaveTypes = await this.getLeaveTypesCache();

        const dvUpdates: Record<string, any> = {};
        if (updates.entitlement !== undefined) dvUpdates.lm_entitlement = updates.entitlement.toString();
        if (updates.used !== undefined) dvUpdates.lm_used = updates.used.toString();
        if (updates.pending !== undefined) dvUpdates.lm_pending = updates.pending.toString();
        if (updates.carryOver !== undefined) dvUpdates.lm_carryover = updates.carryOver.toString();

        const result = await Lm_leavebalancesService.update(id, dvUpdates);
        return mapLeaveBalance(result.data, leaveTypes);
    }

    async createLeaveBalance(balance: Omit<LeaveBalance, 'id' | 'available'>): Promise<LeaveBalance> {
        const leaveTypes = await this.getLeaveTypesCache();
        const leaveType = leaveTypes.find(lt => lt.id === balance.leaveTypeId);

        const result = await Lm_leavebalancesService.create({
            lm_name: `${balance.employeeId}-${leaveType?.code || 'UNK'}-${balance.year}`,
            lm_employeeid: balance.employeeId,
            lm_year: balance.year.toString(),
            lm_entitlement: balance.entitlement.toString(),
            lm_used: balance.used.toString(),
            lm_pending: balance.pending.toString(),
            lm_carryover: balance.carryOver.toString(),
            _lm_leavetype_value: balance.leaveTypeId,
            ownerid: balance.employeeId,
            owneridtype: 'systemuser',
            statecode: 0,
        } as any);

        return mapLeaveBalance(result.data, leaveTypes);
    }

    async initializeBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
        const leaveTypes = await this.getLeaveTypesCache();
        const activeTypes = leaveTypes.filter(lt => lt.isActive);

        const balances: LeaveBalance[] = [];

        for (const leaveType of activeTypes) {
            const result = await Lm_leavebalancesService.create({
                lm_name: `${employeeId}-${leaveType.code}-${year}`,
                lm_employeeid: employeeId,
                lm_year: year.toString(),
                lm_entitlement: '0',
                lm_used: '0',
                lm_pending: '0',
                lm_carryover: '0',
                _lm_leavetype_value: leaveType.id,
                ownerid: employeeId,
                owneridtype: 'systemuser',
                statecode: 0,
            } as any);

            balances.push(mapLeaveBalance(result.data, leaveTypes));
        }

        return balances;
    }

    // ─────────────────────────────────────────────────────────────
    // Leave Types
    // ─────────────────────────────────────────────────────────────

    async getLeaveTypes(): Promise<LeaveType[]> {
        const result = await Lm_leavetypesService.getAll({
            filter: 'statecode eq 0', // Active only
        });

        const types = (result.data || []).map(mapLeaveType);
        types.sort((a, b) => a.sortOrder - b.sortOrder);

        // Update cache
        this.leaveTypesCache = types;

        return types;
    }

    async createLeaveType(leaveType: Omit<LeaveType, 'id'>): Promise<LeaveType> {
        const result = await Lm_leavetypesService.create({
            lm_name: leaveType.name,
            lm_code: leaveType.code,
            lm_color: leaveType.color,
            lm_icon: leaveType.icon,
            lm_requiresapproval: leaveType.requiresApproval ? 1 : 0,
            lm_maxdaysperrequest: leaveType.maxDaysPerRequest?.toString(),
            lm_isactive: leaveType.isActive ? 1 : 0,
            lm_sortorder: leaveType.sortOrder.toString(),
            ownerid: '', // Will be set by system
            owneridtype: 'systemuser',
            statecode: 0,
        } as any);

        // Invalidate cache
        this.leaveTypesCache = null;

        return mapLeaveType(result.data);
    }

    async updateLeaveType(id: string, updates: Partial<LeaveType>): Promise<LeaveType> {
        const dvUpdates: Record<string, any> = {};

        if (updates.name !== undefined) dvUpdates.lm_name = updates.name;
        if (updates.code !== undefined) dvUpdates.lm_code = updates.code;
        if (updates.color !== undefined) dvUpdates.lm_color = updates.color;
        if (updates.icon !== undefined) dvUpdates.lm_icon = updates.icon;
        if (updates.requiresApproval !== undefined) dvUpdates.lm_requiresapproval = updates.requiresApproval ? 1 : 0;
        if (updates.maxDaysPerRequest !== undefined) dvUpdates.lm_maxdaysperrequest = updates.maxDaysPerRequest?.toString();
        if (updates.isActive !== undefined) dvUpdates.lm_isactive = updates.isActive ? 1 : 0;
        if (updates.sortOrder !== undefined) dvUpdates.lm_sortorder = updates.sortOrder.toString();

        const result = await Lm_leavetypesService.update(id, dvUpdates);

        // Invalidate cache
        this.leaveTypesCache = null;

        return mapLeaveType(result.data);
    }

    async deleteLeaveType(id: string): Promise<void> {
        await Lm_leavetypesService.delete(id);

        // Invalidate cache
        this.leaveTypesCache = null;
    }

    // ─────────────────────────────────────────────────────────────
    // Settings
    // ─────────────────────────────────────────────────────────────

    async getSettings(): Promise<AppSetting[]> {
        const result = await Lm_appsettingsService.getAll();
        return (result.data || []).map(mapAppSetting);
    }

    async updateSetting(key: string, value: string): Promise<void> {
        // Find existing setting by key
        const result = await Lm_appsettingsService.getAll({
            filter: `lm_key eq '${key}'`,
        });

        if (result.data && result.data.length > 0) {
            // Update existing
            await Lm_appsettingsService.update(result.data[0].lm_appsettingid, {
                lm_value: value,
            });
        } else {
            // Create new
            await Lm_appsettingsService.create({
                lm_key: key,
                lm_value: value,
                statecode: 0,
            } as any);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Public Holidays
    // ─────────────────────────────────────────────────────────────

    async getPublicHolidays(region: string, year: number): Promise<PublicHoliday[]> {
        const startOfYear = new Date(year, 0, 1).toISOString();
        const endOfYear = new Date(year, 11, 31).toISOString();

        const result = await Lm_publicholidaiesService.getAll({
            filter: `lm_region eq '${region}' and lm_date ge ${startOfYear} and lm_date le ${endOfYear}`,
        });

        return (result.data || []).map(mapPublicHoliday);
    }

    async createPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<PublicHoliday> {
        const result = await Lm_publicholidaiesService.create({
            lm_name: holiday.name,
            lm_date: holiday.date.toISOString(),
            lm_region: holiday.region,
            lm_isrecurring: holiday.isRecurring ? 1 : 0,
            statecode: 0,
        } as any);

        return mapPublicHoliday(result.data);
    }

    async updatePublicHoliday(id: string, updates: Partial<PublicHoliday>): Promise<PublicHoliday> {
        const dvUpdates: Record<string, any> = {};

        if (updates.name !== undefined) dvUpdates.lm_name = updates.name;
        if (updates.date !== undefined) dvUpdates.lm_date = updates.date.toISOString();
        if (updates.region !== undefined) dvUpdates.lm_region = updates.region;
        if (updates.isRecurring !== undefined) dvUpdates.lm_isrecurring = updates.isRecurring ? 1 : 0;

        const result = await Lm_publicholidaiesService.update(id, dvUpdates);
        return mapPublicHoliday(result.data);
    }

    async deletePublicHoliday(id: string): Promise<void> {
        await Lm_publicholidaiesService.delete(id);
    }
}

// Export singleton instance
export const dataverseAdapter = new DataverseAdapter();
