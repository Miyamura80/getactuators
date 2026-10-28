import type { Actuator, Robot } from "@/catalog";
import { getActuator } from "@/catalog";
import { resolveJoints, robotsUsingActuator } from "@/catalog/query";
import { absoluteUrl } from "@/server/site";
import type {
    ApiActuator,
    ApiJoint,
    ApiRobot,
    ApiRobotDetail,
    ApiRobotRef,
} from "./schemas";

// Catalog records -> API representations (stable field set, absolute links).

export const actuatorApiUrl = (id: string) =>
    absoluteUrl(`/api/v1/actuators/${encodeURIComponent(id)}`);
export const robotApiUrl = (id: string) =>
    absoluteUrl(`/api/v1/robots/${encodeURIComponent(id)}`);

export function serializeActuator(a: Actuator): ApiActuator {
    return {
        ...a,
        image_url: a.image_url ?? null,
        url: absoluteUrl(`/actuators/${encodeURIComponent(a.id)}`),
        api_url: actuatorApiUrl(a.id),
        price_history_url: absoluteUrl(`/api/v1/prices/${encodeURIComponent(a.id)}`),
    };
}

function robotRef(r: Robot): ApiRobotRef {
    return {
        id: r.id,
        name: r.name,
        brand: r.brand,
        url: absoluteUrl(`/robots#${encodeURIComponent(r.id)}`),
        api_url: robotApiUrl(r.id),
    };
}

export function serializeActuatorDetail(a: Actuator) {
    return {
        ...serializeActuator(a),
        robots_using: robotsUsingActuator(a.id).map(robotRef),
    };
}

function robotBase(r: Robot) {
    const {
        joints: _joints,
        image_fit: _imageFit,
        image_crop: _imageCrop,
        ...rest
    } = r;
    return {
        ...rest,
        height_m: r.height_m ?? null,
        image_url: r.image_url ?? null,
        ...robotRef(r),
    };
}

export function serializeRobot(r: Robot): ApiRobot {
    return {
        ...robotBase(r),
        joint_count: r.joints.reduce((n, j) => n + j.count, 0),
    };
}

export function serializeRobotDetail(r: Robot): ApiRobotDetail {
    const joints: ApiJoint[] = resolveJoints(r).map((j) => {
        const linked = j.motor.actuator_id
            ? getActuator(j.motor.actuator_id)
            : undefined;
        return {
            role: j.role,
            count: j.count,
            motor: {
                ...j.motor,
                actuator_api_url: linked ? actuatorApiUrl(linked.id) : null,
            },
        };
    });
    return { ...robotBase(r), joints };
}
