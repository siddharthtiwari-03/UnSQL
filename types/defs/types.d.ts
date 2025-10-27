export const unused: {};
/**
 * encryption modes
 */
export type EncryptionModes = "aes-128-ecb" | "aes-256-cbc";
/**
 * encryption sha
 */
export type EncryptionSHAs = 224 | 256 | 384 | 512;
/**
 * casting types
 */
export type CastingTypes = "char" | "nchar" | "date" | "dateTime" | "signed" | "unsigned" | "decimal" | "binary" | "integer";
/**
 * debug types
 */
export type DebugTypes = "query" | "error" | "benchmark" | "benchmark-query" | "benchmark-error" | boolean | undefined;
/**
 * set configuration for Encryption/Decryption
 */
export type EncryptionConfig = {
    /**
     * (optional) set encryption mode
     */
    mode?: EncryptionModes | undefined;
    /**
     * (optional) set default 'secret' to be used
     */
    secret?: string | undefined;
    /**
     * (optional) set initialization vector 'iv' (used only with 'cbc' modes)
     */
    iv?: string | undefined;
    /**
     * (optional) set SHA
     */
    sha?: EncryptionSHAs | undefined;
};
/**
 * UnSQL config
 */
export type ConfigObject = {
    /**
     * name of the table to be mapped with this model class
     */
    table: string;
    /**
     * protects accidental execution of 'delete-all'
     */
    safeMode?: boolean | undefined;
    /**
     * prevents 'reset' of data, enables Export/Import of records
     */
    devMode?: boolean | undefined;
    /**
     * mysql 'connection' object
     */
    connection?: Object | undefined;
    /**
     * mysql connection 'pool' object
     */
    pool?: any;
    /**
     * dialect to be used
     */
    dialect?: "mysql" | "postgresql" | "sqlite" | undefined;
    /**
     * dialect to be used
     */
    dbEncryptionMode?: EncryptionModes | "unknown" | undefined;
    /**
     * defines Encryption/Decryption config for this model
     */
    encryption?: EncryptionConfig | undefined;
};
/**
 * base aggregator
 */
export type BaseAggregate = {
    value: Object;
    distinct?: boolean | undefined;
    compare?: Object | undefined;
    ifNull?: string | number | boolean | undefined;
    cast?: CastingTypes | undefined;
    as?: string | undefined;
};
/**
 * between wrapper
 */
export type BetweenObject = {
    gt: number | string;
    lt: number | string;
};
/**
 * between wrapper
 */
export type BetweenWrapper = {
    between: {
        gt: number | string;
        lt: number | string;
    };
};
/**
 * string object
 */
export type StringObject = {
    value: string;
    decrypt?: EncryptionConfig | undefined;
    encoding?: string | undefined;
    reverse?: boolean | undefined;
    textCase?: "upper" | "lower" | undefined;
    replace?: {
        target: string;
        replaceWith: string;
    } | undefined;
    padding?: {
        left?: {
            length: number;
            pattern: string;
        };
        right?: {
            length: number;
            pattern: string;
        };
    } | undefined;
    substr?: {
        start: number;
        length: number;
    } | undefined;
    trim?: boolean | "left" | "right" | undefined;
    cast?: CastingTypes | undefined;
    compare?: ValuesObject | ComparatorObjects | undefined;
    as?: string | undefined;
};
/**
 * numeric object
 */
export type NumericObject = {
    value: number | string;
    decrypt?: EncryptionConfig | undefined;
    encoding?: string | undefined;
    encrypt?: EncryptionConfig | undefined;
    decimals?: number | "floor" | "ceil" | "round" | undefined;
    sub?: string | number | undefined;
    add?: string | number | undefined;
    power?: string | number | undefined;
    divideBy?: string | number | undefined;
    multiplyBy?: string | number | undefined;
    mod?: string | number | undefined;
    cast?: CastingTypes | undefined;
    compare?: ValuesObject | ComparatorObjects | undefined;
    as?: string | undefined;
};
/**
 * date object
 */
export type DateObject = {
    value: string;
    decrypt?: EncryptionConfig | undefined;
    encoding?: string | undefined;
    encrypt?: EncryptionConfig | undefined;
    cast?: CastingTypes | undefined;
    fromPattern?: string | undefined;
    format?: string | undefined;
    sub?: string | number | undefined;
    add?: string | number | undefined;
    compare?: ValuesObject | ComparatorObjects | undefined;
    as?: string | undefined;
};
/**
 * if object
 */
export type IfObject = {
    check: boolean | WhereObject;
    trueValue: any;
    falseValue: any;
    cast?: CastingTypes | undefined;
    as?: string | undefined;
};
/**
 * concat object
 */
export type ConcatObject = {
    value: SelectObject;
    pattern: string | number | boolean;
    reverse?: boolean | undefined;
    textCase?: "upper" | "lower" | undefined;
    padding?: {
        left?: {
            length: number;
            pattern: string;
        };
        right?: {
            length: number;
            pattern: string;
        };
    } | undefined;
    substr?: {
        start: number;
        length: number;
    } | undefined;
    trim?: boolean | "left" | "right" | undefined;
    compare?: ValuesObject | ComparatorObjects | undefined;
    as?: string | undefined;
};
/**
 * when then object
 */
export type WhenThenCondition = {
    when: boolean | WhereObject;
    then: ValuesObject;
};
/**
 * Switch object
 */
export type SwitchObject = {
    check: Array<WhenThenCondition>;
    else: ValuesObject;
    cast?: CastingTypes | undefined;
    as?: string | undefined;
};
/**
 * value options
 */
export type ValueOptions = string | number | boolean | Date | WrapperMethods;
/**
 * values
 */
export type ValuesObject = ValueOptions | ValueOptions[];
/**
 * comparators
 */
export type ComparatorObjects = {
    eq: ValuesObject;
} | {
    notEq: ValuesObject;
} | {
    in: ValuesObject;
} | {
    notIn: ValuesObject;
} | {
    lt: ValuesObject;
} | {
    gt: ValuesObject;
} | {
    ltEq: ValuesObject;
} | {
    gtEq: ValuesObject;
} | {
    like: ValuesObject;
} | {
    notLike: ValuesObject;
} | {
    startLike: ValuesObject;
} | {
    endLike: ValuesObject;
} | {
    notStartLike: ValuesObject;
} | {
    notEndLike: ValuesObject;
};
/**
 * partial query object
 */
export type PartialQuery = {
    table?: string | undefined;
    alias?: string | undefined;
    join?: JoinObject | undefined;
    where?: WhereObject | undefined;
    groupBy?: string[] | undefined;
    having?: HavingObject | undefined;
    orderBy?: {
        [key: string]: "asc" | "desc";
    }[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    as?: string | undefined;
};
/**
 * json base object
 */
export type JsonObject = {
    value: string | {
        [key: string]: ValuesObject;
    } | Array<any>;
    aggregate?: boolean | undefined;
    extract?: string | undefined;
    contains?: string | number | boolean | (string | number | boolean)[] | undefined;
    compare?: ComparatorObjects | undefined;
};
/**
 * json base object
 */
export type BaseJson = PartialQuery & JsonObject;
/**
 * sub-query object
 */
export type SubQuery = {
    select?: SelectObject | undefined;
    junction?: "and" | "or" | undefined;
};
/**
 * sub-query object
 */
export type BaseQuery = PartialQuery & SubQuery;
/**
 * join object
 */
export type JoinQuery = {
    select?: SelectObject | undefined;
    type?: "left" | "right" | "inner" | "fullOuter" | "cross" | undefined;
    junction?: "and" | "or" | undefined;
    using: string[] | {
        [column: string]: string;
    };
};
/**
 * join object
 */
export type BaseJoin = PartialQuery & JoinQuery;
/**
 * wrapper methods
 */
export type WrapperMethods = {
    str?: StringObject | undefined;
    num?: NumericObject | undefined;
    date?: DateObject | undefined;
    concat?: ConcatObject | undefined;
    case?: SwitchObject | undefined;
    if?: IfObject | undefined;
    json?: BaseJson | undefined;
    array?: BaseJson | undefined;
    refer?: BaseQuery | undefined;
};
/**
 * composite methods
 */
export type CompositeMethods = {
    and?: (WrapperMethods | CustomWrapper | AggregateWrappers)[] | undefined;
    or?: (WrapperMethods | CustomWrapper | AggregateWrappers)[] | undefined;
    between?: BetweenObject | undefined;
};
/**
 * aggregator methods
 */
export type AggregateWrappers = {
    count?: BaseAggregate | undefined;
    sum?: BaseAggregate | undefined;
    min?: BaseAggregate | undefined;
    max?: BaseAggregate | undefined;
    avg?: BaseAggregate | undefined;
};
/**
 * select types
 */
export type selectTypes = ValueOptions | AggregateWrappers;
/**
 * select object
 */
export type SelectObject = selectTypes[];
/**
 * custom wrapper
 */
export type CustomWrapper = {
    [key: string]: (ValuesObject | ComparatorObjects | {
        between: BetweenObject;
    });
};
/**
 * where object
 */
export type WhereObject = (ValuesObject | CustomWrapper | WrapperMethods | CompositeMethods);
/**
 * having object
 */
export type HavingObject = AggregateWrappers | WhereObject;
/**
 * join object
 */
export type JoinObject = BaseJoin[];
/**
 * Logical junction types
 */
export type JunctionKeys = "and" | "or";
export type HandleFuncKey = "and" | "or" | "between" | "if" | "case" | "count" | "sum" | "min" | "max" | "avg";
